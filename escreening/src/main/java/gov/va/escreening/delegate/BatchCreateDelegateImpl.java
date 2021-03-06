package gov.va.escreening.delegate;

import com.google.common.collect.Lists;
import gov.va.escreening.domain.VeteranDto;
import gov.va.escreening.domain.VeteranWithClinicalReminderFlag;
import gov.va.escreening.dto.BatchBatteryCreateResult;
import gov.va.escreening.entity.AssessmentAppointment;
import gov.va.escreening.entity.Veteran;
import gov.va.escreening.repository.AssessmentAppointmentRepository;
import gov.va.escreening.repository.ClinicRepository;
import gov.va.escreening.repository.VeteranRepository;
import gov.va.escreening.repository.VistaRepository;
import gov.va.escreening.security.EscreenUser;
import gov.va.escreening.service.VeteranAssessmentService;
import gov.va.escreening.service.VeteranService;
import gov.va.escreening.service.VeteranServiceImpl;
import gov.va.escreening.vista.dto.VistaClinicAppointment;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.collections4.map.HashedMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BatchCreateDelegateImpl implements BatchBatteryCreateDelegate {
	@Autowired
	VistaRepository vistaRepo;

	@Autowired
	ClinicRepository clinicRepo;

	@Autowired
	private VistaRepository vistaService;

	@Autowired
	private VeteranService veteranService;

	@Autowired
	private VeteranRepository veteranRepo;

//	@Autowired
//	private CreateAssessmentDelegate createAssessmentDelegate;
//	
	@Autowired
	private VeteranAssessmentService vetAssessSvc;
	
	private static Logger logger = LoggerFactory
			.getLogger(BatchCreateDelegateImpl.class);

	@Override
	public List<VistaClinicAppointment> searchVeteranByAppointments(
			EscreenUser user, String clinicIen, String startdate, String enddate) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy/MM/dd");
		Date start;
		try {
			start = format.parse(startdate);
			Date end = format.parse(enddate);

			return searchVeteranByAppointments(user, clinicIen, start, end);
		} catch (ParseException e) {
			throw new IllegalArgumentException(e);
		}

	}

	@Override
	public List<VistaClinicAppointment> searchVeteranByAppointments(
			EscreenUser user, String clinicIen, Date start, Date end) {

		try {
			// need to set end to the end of the day here.
			Calendar c = Calendar.getInstance();
			c.setTime(end);
			c.add(Calendar.HOUR, 23);
			c.add(Calendar.MINUTE, 59);
			
			List<VistaClinicAppointment> appList = vistaRepo
					.getAppointmentsForClinic(user.getVistaDivision(),
							user.getVistaVpid(), user.getVistaDuz(), "ESCREEN",
							clinicIen, start, c.getTime());

			if(appList == null || appList.isEmpty())
			{
				return Lists.newArrayList();
			}
			
			Map<String, VistaClinicAppointment> appMap = new HashedMap<String, VistaClinicAppointment>();

			// Now, go through the veterans and only return the closest
			// appointment to the startDate???
			for (VistaClinicAppointment app : appList) {
				if (app==null) continue;
				String vetIen = app.getVeteranIen();
				if (appMap.containsKey(vetIen)) {
					Date appTime = app.getAppointmentDate();
					Date current = Calendar.getInstance().getTime();
					if (appTime.after(current)) {
						if (appTime.before(appMap.get(vetIen)
								.getAppointmentDate())) {
							appMap.put(vetIen, app);
						}
					}
				} else {
					appMap.put(vetIen, app);
				}
			}

			return new ArrayList<VistaClinicAppointment>(appMap.values());
		} catch (Exception ex) {
			logger.error("Error getting veterans by appointments", ex);
			return new ArrayList<VistaClinicAppointment>();
		}
	}

	/**
	 * Import a list of veterans
	 * 
	 * @param iens
	 * @param escreenUser
	 * @return
	 */
	private List<VeteranDto> importVeterans(List<String> iens,
			EscreenUser escreenUser) {
		List<VeteranDto> vList = new ArrayList<VeteranDto>();

		for (String ien : iens) {
			VeteranDto vistaVeteranDto = vistaService.getVeteran(
					escreenUser.getVistaDivision(), escreenUser.getVistaVpid(),
					escreenUser.getVistaDuz(), "", ien);

			Integer veteranId = veteranService
					.importVistaVeteranRecord(vistaVeteranDto);

			vistaVeteranDto.setVeteranId(veteranId);

			vList.add(vistaVeteranDto);
		}
		return vList;
	}

	@Override
	public List<VeteranWithClinicalReminderFlag> getVeteranDetails(
			String[] veteranIens, EscreenUser user,
			List<VistaClinicAppointment> appList) {
		// TODO Auto-generated method stub
		List<String> vetInDB = new ArrayList<String>();
		List<String> vetToImport = new ArrayList<String>();
		List<Veteran> vetList = veteranRepo.getVeteranByIens(veteranIens);

		for (Veteran v : vetList) {
			vetInDB.add(v.getVeteranIen());
		}

		for (String s : veteranIens) {
			if (!vetInDB.contains(s)) {
				vetToImport.add(s);
			}
		}

		List<VeteranDto> imported = importVeterans(vetToImport, user);

		List<VeteranWithClinicalReminderFlag> result = new ArrayList<VeteranWithClinicalReminderFlag>(
				imported.size());
		for (Veteran v : vetList) {
			result.add(new VeteranWithClinicalReminderFlag(VeteranServiceImpl
					.convertVeteranToVeteranDto(v)));
		}

		for (VeteranDto dto : imported) {
			result.add(new VeteranWithClinicalReminderFlag(dto));
		}

		for (VeteranWithClinicalReminderFlag v : result) {
			for (VistaClinicAppointment appt : appList) {
				if (appt.getVeteranIen().equals(v.getVeteranIen())) {
					v.setApptDate(appt.getApptDate());
					v.setApptTime(appt.getApptTime());
					break;
				}
			}
		}
		return result;
	}

	@Override
	public List<BatchBatteryCreateResult> batchCreate(
			List<VeteranWithClinicalReminderFlag> vets, int programId,
			int clinicId, int clinicianId, int noteTitleId, int batteryId,
			Map<Integer, Set<Integer>> surveyMap, List<Integer> selectedSurvey,
			EscreenUser escreenUser) {
		List<BatchBatteryCreateResult> resultList = new ArrayList<BatchBatteryCreateResult>(
				vets.size());
		for (VeteranWithClinicalReminderFlag vet : vets) {
			Set<Integer> surveyList = surveyMap.get(vet.getVeteranId());
			if (surveyList == null) {
				surveyList = new HashSet<Integer>();
			}
			if (selectedSurvey != null && !selectedSurvey.isEmpty()) {
				surveyList.addAll(selectedSurvey);
			}
			BatchBatteryCreateResult result = new BatchBatteryCreateResult();
			result.setVet(vet);
			if (surveyList.isEmpty()) {
				result.setSucceed(false);
				result.setErrorMsg("No survey selected for the battery");
			}
			// Add
			try {
				String apptDate = vet.getApptDate();
				String apptTime = vet.getApptTime();
				
				String dateTime = apptDate + " " + apptTime;
				SimpleDateFormat format = new SimpleDateFormat("MM/dd/yyyy HH:mm");
				Date d = format.parse(dateTime);
			
				boolean succeed = vetAssessSvc.createAssessmentWithAppointment(
						vet.getVeteranId(), programId, clinicId, clinicianId,
						escreenUser.getUserId(), noteTitleId, batteryId, new ArrayList<Integer>(
								surveyList), d);
				result.setSucceed(succeed);
			
			
			} catch (Exception ex) {
				logger.error("Error creating assessment for veteran Id= "
						+ vet.getVeteranId(), ex);
				result.setErrorMsg("Error occurred: " + ex.getMessage());
				result.setSucceed(false);
			}

			resultList.add(result);
		}

		return resultList;

	}
}
