$(document).ready(function() {
    // Load current tab
    tabsLoad("createBattery");


	// Add Ladda preloader
	// Ladda.bind( '.createAssessmentButton', 20000 );

	// Load Selected Program 
	var $li = $('.battery_list').find('li');
	
	var selectedProgramId 	= "#selectedProgramId";
	var selectedClinicId 	= "#selectedClinicId";
	var clearAllBtn 		= ".clear_all";
	var clearAllModulesBtn 	= ".clear_all_modules"

	
	// Load Selected Program
	loadSelectedProgram();
	
	// Tri State Check
   	var $check = $(".tri input[type=checkbox]"), el;
	$check
   .data('checked',0)
   .click(function(e) {
        el = $(this);  
        switch(el.data('checked')) {
            // unchecked, going indeterminate
            case 0:
                el.data('checked',1);
                el.prop('indeterminate',true);
				el.prop('checked',false);
                break;
            
            // indeterminate, going checked
            case 1:
                el.data('checked',2);
                el.prop('indeterminate',false);
                el.prop('checked',true);       
                break;
            
            // checked, going unchecked
            default:  
                el.data('checked',0);
                el.prop('indeterminate',false);
                el.prop('checked',false);
        }
    });
	
	
	/* Need to clean - From edit Veteran Assessment */
	var module_values = [];
	var reset_check = false;
	
	$(".module_list").find(':checked').each(function() {
		   module_values.push($(this).val());
	});
	
	$(clearAllBtn).on("click", function(e) {
		e.preventDefault();
		clearAllSelectins();
	});

	$(clearAllModulesBtn).on("click", function(e) {
		e.preventDefault();
		clearAllModulesSelectins();
	});		
	
	$(".reset").on("click", function(e) {
		e.preventDefault();
		$('input:checkbox').removeAttr('checked');
		$("tr").removeClass("highlight");
		for ( var i in module_values ) {
			$("input:checkbox[value="+module_values[i]+"]").prop('checked', true);
		}
		reset_check = false;
	});
	
	$(".battery_list li span").on("click", function(e) {
		e.preventDefault();
		if (this.className.indexOf("highlight") > -1) {
			$("tr").removeClass("highlight");
			var classes = $(this).attr('class').split(' ');

			for(var i=0; i<classes.length; i++){
			  $("."+classes[i]).closest("tr").addClass("highlight"); 
			}	
		}else{
			//$('input:checkbox').removeAttr('checked');
			$("." + $(this).attr('class')).prop('checked', true);
			$("tr").removeClass("highlight");
			var classes = $(this).attr('class').split(' ');

			for(var i=0; i<classes.length; i++){
				  $("."+classes[i]).closest("tr").addClass("highlight"); 
			}
		}
	});

	
	/* Need to clean - From edit Veteran Assessment */
		$(selectedProgramId).change(function() {
		$.ajax({
			url: 'editVeteranAssessment/programs/' + $(selectedProgramId).val() + '/clinics',
			dataType: 'json',
			type: 'GET',
			success: function(data) {
				$(selectedClinicId).empty(); // clear the current elements in select box
				$(selectedClinicId).append($('<option></option>').attr('value', '').text('Please Select a Clinic'));
				for (row in data) {
					$(selectedClinicId).append($('<option></option>').attr('value', data[row].stateId).text(data[row].stateName));
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				//alert(errorThrown);
			}
		});

		$.ajax({
			url: 'editVeteranAssessment/programs/' + $(selectedProgramId).val() + '/noteTitles',
			dataType: 'json',
			type: 'GET',
			success: function(data) {
				$('#selectedNoteTitleId').empty();
				$('#selectedNoteTitleId').append($('<option></option>').attr('value', '').text('Please Select a Note Title'));
				for (row in data) {
					$('#selectedNoteTitleId').append($('<option></option>').attr('value', data[row].stateId).text(data[row].stateName));
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				//alert(errorThrown);
			}
		});

		$.ajax({
			url: 'editVeteranAssessment/programs/' + $(selectedProgramId).val() + '/clinicians',
			dataType: 'json',
			type: 'GET',
			success: function(data) {
				$('#selectedClinicianId').empty();
				$('#selectedClinicianId').append($('<option></option>').attr('value', '').text('Please Select a Clinician'));
				for (row in data) {
					$('#selectedClinicianId').append($('<option></option>').attr('value', data[row].stateId).text(data[row].stateName));
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				/// alert("Error");
			}
		});
		
		// Filter 
		$(".program_1").addClass("hide2");	        
	});
	
	$(".battery_list input").on("click", function(e) {
		 clearAllCheckbox();
		function check(x, i){
			element = "selectedSurveyIdList"+i;
			if(x == 0){				
				$(element).attr('checked', false);
			}
			if(x == 1){
				document.getElementById(element).indeterminate = true;
				$(element).prop("indeterminate", true);
				$(element).attr('checked', false);  
			}
			if(x == 2){
				$(element).attr('checked', true);
			}
		}

		function dataFormat(data){
			data.replace('{','').replace('}','').replace(/\s/g,"").split(',');
			return data;			
		}
		var data = $(this).attr("data-ref")
		data = data.replace('{','').replace('}','').replace(/\s/g,"").split(',');
		
		for (i = 0; i < data.length; ++i) {   
			check(data[i], i+1);
		}
			
		/*
		if(reset_check == false){for ( var i in module_values ) {$("input:checkbox[value="+module_values[i]+"]").prop('checked', true);}}*/

		$(".module_list  ." + $(this).attr('class')).prop('checked', true);
		$(".module_list tr").removeClass("highlight");
		
		var classes = $(this).attr('class').split(' ');

		
		for(var i=0; i< classes.length; i++){
			 $(".module_list ."+classes[i]).closest("tr").addClass("highlight"); 
		}
			
	});
	
		
	// Filter Batteries that assigned to a specific program - JH
	function clearAllCheckbox() {
		var checkbox 	= 'input:checkbox';
		var tr 			= 'tr';
		
		$(checkbox).removeAttr('checked');
		$(tr).removeClass("highlight");
		$(checkbox).removeAttr('indeterminate');
		$(checkbox).prop("indeterminate", false); 
		reset_check = true;
		keepDirectionCheckboxes();
	}
	
	function clearAllSelectins() {
		var checkbox 	= 'input:checkbox';
		var radio 		= 'input:radio';
		var tr 			= 'tr';
		
		$(checkbox).removeAttr('checked');
		$(radio).removeAttr('checked');
		$(tr).removeClass("highlight");
		$(checkbox).removeAttr('indeterminate');
		$(checkbox).prop("indeterminate", false); 
		reset_check = true;
		
		keepDirectionCheckboxes();
	}
	
	function clearAllModulesSelectins() {
		var checkbox 	= 'input:checkbox';
		var tr 			= 'tr';

		$(checkbox).removeAttr('checked');
		$(tr).removeClass("highlight");
		$(checkbox).removeAttr('indeterminate');
		$(checkbox).prop("indeterminate", false); 
		
		reset_check = true;
		keepDirectionCheckboxes();
	}
	
	$(selectedProgramId).on("change", function(e) {
		loadSelectedProgram();
	});
	
	function loadSelectedProgram(){
		var selectedProgramIdVal = $("#selectedProgramId").val();
		$li.hide().filter(".program_" + selectedProgramIdVal).show();
		
		if((selectedProgramIdVal == "") || (typeof selectedProgramIdVal == "undefined" )){
			$li.show();	
		}
	}
	
	$(function() {
		$(selectedClinicId).change(function() {
		});
	});
	
	function keepDirectionCheckboxes(){
		// keep directions checkboxes the same
		document.getElementsByClassName("directionIndeterminate")[0].indeterminate = true;
		$(".directionChecked").prop('checked',true);
	}
	
	
	/* Direction block to fix the checkboxes
	document.getElementsByClassName("directionIndeterminate")[0].indeterminate = true;
	$(".directionIndeterminate").on("click", function(e) {
		document.getElementsByClassName("directionIndeterminate")[0].indeterminate = true;
	});
	*/
	$(".directionChecked").on("click", function(e) {
		$(this).prop('checked',true);
	});

	$(function () {
		$('#selectedClinicianId').change(function () {
			if ($('#selectedClinicianId').val() != '') {
				// make an ajax call to editVeteranAssessment which will return surveys and also clinical reminders for the selected clinician id
				$.ajax({
					url: 'editVeteransAssessment',
					type: 'GET',
					data: 'vid=51&clinicianId=' + $('#selectedClinicianId').val() + '&programId=' + $('#selectedProgramId').val() + '&clinicId=' + $('#selectedClinicId').val() + '&noteTitleId=' + $('#selectedNoteTitleId').val(),
					dataType: 'html',
					async:true,
					success: function (data) {
						//console.log(data);
						$('#output').html(data);
					},
					error: function (jqXHR, textStatus, errorThrown) {
						alert(errorThrown);
					}
				});
			} else {
				$('#output').html('');
			}
		});
	});


});