/**
 * Created by pouncilt on 8/4/14.
 */
Editors.controller('addEditModuleController', ['$rootScope', '$scope', '$state', 'SurveyService', 'QuestionService', 'surveyUIObject', 'pageQuestionItems', function($rootScope, $scope, $state, SurveyService, QuestionService, surveyUIObject, pageQuestionItems){
    var tmpList = [],
        createSurvey = function(selectedModuleDomainObject) {
            SurveyService.create(SurveyService.setUpdateSurveyRequestParameter(selectedModuleDomainObject)).then(function (response){
                if(Object.isDefined(response)) {
                    if (response.isSuccessful()) {
                        $scope.selectedSurveyUIObject = response.getPayload().toUIObject();
                        $rootScope.addMessage($rootScope.createSuccessSaveMessage(response.getMessage()));
                    } else {
                        $rootScope.addMessage($rootScope.createErrorMessage(response.getMessage()));
                        console.error("modulesEditController.save() method. Expected successful response object from SurveyService.update() method to be successful.");
                    }
                }
            }, function(responseError) {
                $rootScope.addMessage($rootScope.createErrorMessage(responseError.getMessage()));
            });
        },
        updateSurvey = function (selectedModuleDomainObject) {
            SurveyService.update(SurveyService.setUpdateSurveyRequestParameter(selectedModuleDomainObject)).then(function (response){
                if(Object.isDefined(response)) {
                    if (response.isSuccessful()) {
                        $scope.selectedSurveyUIObject = response.getPayload().toUIObject();
                        $rootScope.addMessage($rootScope.createSuccessSaveMessage(response.getMessage()));
                    } else {
                        $rootScope.addMessage($rootScope.createErrorMessage(response.getMessage()));
                        console.error("modulesEditController.save() method. Expected successful response object from SurveyService.update() method to be successful.");
                    }
                }


            }, function(responseError) {
                $rootScope.addMessage($rootScope.createErrorMessage(responseError.getMessage()));
            });
        },
        createQuestion = function(selectedQuestionDomainObject) {
            QuestionService.create(QuestionService.setUpdateQuestionRequestParameter(selectedQuestionDomainObject)).then(function(response){
                if(Object.isDefined(response)) {
                    if (response.isSuccessful()) {
                        $scope.setSelectedQuestionUIObject(response.getPayload().toUIObject());
                        $rootScope.addMessage($rootScope.createSuccessSaveMessage(response.getMessage()));
                    } else {
                        $rootScope.addMessage($rootScope.createErrorMessage(response.getMessage()));
                        console.error("modulesEditController.save() method. Expected successful response object from QuestionService.update() method to be successful.");
                    }
                }
            }, function(responseError) {
                $rootScope.addMessage($rootScope.createErrorMessage(responseError.getMessage()));
            });
        },
        updateQuestion = function (selectedQuestionDomainObject){
            QuestionService.update(QuestionService.setUpdateQuestionRequestParameter(selectedQuestionDomainObject)).then(function(response){
                if(Object.isDefined(response)) {
                    if (response.isSuccessful()) {
                        $scope.setSelectedQuestionUIObject(response.getPayload().toUIObject());
                        $rootScope.addMessage($rootScope.createSuccessSaveMessage(response.getMessage()));
                    } else {
                        $rootScope.addMessage($rootScope.createErrorMessage(response.getMessage()));
                        console.error("modulesEditController.save() method. Expected successful response object from QuestionService.update() method to be successful.");
                    }
                }
            }, function(responseError) {
                $rootScope.addMessage($rootScope.createErrorMessage(responseError.getMessage()));
            });
        },
        setQuestionUIObjects = function () {
            QuestionService.queryBySurveyId(QuestionService.setQueryBySurveyIdSearchCriteria(surveyUIObject.id)).then(function (existingQuestions){
                $scope.sections = EScreeningDashboardApp.models.Question.toUIObjects(existingQuestions);
            }, function(responseError) {
                $rootScope.addMessage($rootScope.createErrorMessage(responseError.getMessage()));
            });
        },
        getSelectedQuestionDomainObject = function () {
            var firstChildQuestionAnswers = $scope.getFirstChildMeasureAnswers($scope.selectedQuestionUIObject.childQuestions);

            $scope.selectedQuestionUIObject.childQuestions.forEach(function (childMeasure, index) {
                if(index > 0) {
                    childMeasure.answers = firstChildQuestionAnswers;
                }
            });

            return new EScreeningDashboardApp.models.Question($scope.selectedQuestionUIObject);
        };

    $scope.textFormatDropDownMenuOptions = [];
    $scope.setTextFormatDropDownMenuOptions = function(textFormatTypeMenuOptions) {
        $scope.textFormatDropDownMenuOptions = textFormatTypeMenuOptions;
    };

    $scope.setSelectedSurveyUIObject((Object.isDefined(surveyUIObject)) ? surveyUIObject: $scope.createModule().toUIObject());
    $scope.setPageQuestionItems((Object.isArray(pageQuestionItems) && pageQuestionItems.length > 0)? pageQuestionItems : $scope.pageQuestionItems);

    $scope.getFirstChildMeasureAnswers = function(childQuestions) {
        return EScreeningDashboardApp.models.Question.getFirstChildMeasureAnswers(childQuestions);
    };
    $scope.getDefaultTextFormatType = function (targetQuestionUIObject, dropDownMenuOptions) {
        var defaultTextFormatTypeValidation = new EScreeningDashboardApp.models.Validation().toUIObject();

        if(Object.isDefined(targetQuestionUIObject)) {
           if(Object.isArray(targetQuestionUIObject.validations)) {
               targetQuestionUIObject.validations.some(function(validation, index) {
                   if(validation.name === "dataType") {
                       dropDownMenuOptions.some(function(dropDownMenuOption) {
                            if(dropDownMenuOption.name === validation.name && dropDownMenuOption.value === validation.value){
                                defaultTextFormatTypeValidation = dropDownMenuOption;
                                return true;
                            }
                       });

                       if(Object.isDefined(defaultTextFormatTypeValidation)) {
                           return true;
                       }
                   }
               });
           }
        }

        return defaultTextFormatTypeValidation;
    };

    $scope.save = function () {
        var selectedModuleDomainObject = new EScreeningDashboardApp.models.Survey($scope.selectedSurveyUIObject),
            selectedQuestionDomainObject = getSelectedQuestionDomainObject();

        if(selectedModuleDomainObject.getId() > -1) {
            updateSurvey(selectedModuleDomainObject);
        } else {
            createSurvey(selectedModuleDomainObject);
        }

        if(selectedQuestionDomainObject.getId() > -1) {
            updateQuestion(selectedQuestionDomainObject);
        } else {
            createQuestion(selectedQuestionDomainObject);
        }

        $state.go('modules.detail.questions.blank');
    };

    /*$scope.addToPageQuestion = function (resetFormFunction, state, softReset) {
        var selectedQuestionDomainObject = getSelectedQuestionDomainObject();
        softReset = (Object.isBoolean(softReset))? softReset: false;

        $scope.addQuestion(selectedQuestionDomainObject);
        resetFormFunction(state.name, state.params, softReset);
    };*/

    $scope.cancel = function () {
        $state.go('modules.detail.questions.blank');
    };

    /*$scope.addQuestion = function(){
        $scope.setSelectedQuestionUIObject($rootScope.createQuestion());
        $state.go('modules.detail.questions.editReadOnly');
    };*/

    $scope.editQuestion = function(selectedPageQuestionItem){
        var stateName,
            softReset = false,
            state = {
                name: undefined,
                params: {selectedQuestionId: selectedPageQuestionItem.getItem().toUIObject()},
                doTransition: false
            };

        $scope.setShowUpdateButtons(true);

        switch (selectedPageQuestionItem.getItem().toUIObject().type){
            case 'freeText':
            case 'readOnly':
                stateName = "modules.detail.questions.editReadOnly";
                break;
            case 'selectOne':
                stateName = "modules.detail.questions.editSelectOne";
                break;
            case'selectMulti':
                stateName = "modules.detail.questions.editSelectMultiple";
                break;
            case 'selectOneMatrix':
                stateName = "modules.detail.questions.editSelectOneMatrix";
                break;
            case 'selectMultiMatrix':
                stateName = "modules.detail.questions.editSelectMultipleMatrix";
                break;
            case 'tableQuestion':
                stateName = "modules.detail.questions.editTable";
                break;
            case 'instruction':
                stateName = "modules.detail.questions.editInstruction";
                break;
            default:
                stateName = "modules.detail.questions.editReadOnly";
        }

        if(Object.isDefined(stateName)) {
            $state.go(stateName, {selectedQuestionId: selectedPageQuestionItem.getItem().toUIObject().id});
            $scope.setSelectedPageQuestionItem(selectedPageQuestionItem);
            $scope.setSelectedQuestionUIObject(selectedPageQuestionItem.getItem().toUIObject());
            $scope.selectedQuestionUIObject.textFormatDropDownMenu = $scope.getDefaultTextFormatType($scope.selectedQuestionUIObject, $scope.textFormatDropDownMenuOptions);
        }
    };

    $scope.deleteQuestion = function(question){
        $rootScope.messageHandler.clearMessages();
        QuestionService.remove(QuestionService.setRemoveQuestionRequestParameter($scope.selectedSurveyUIObject.id, question.id)).then(function(response){
            setQuestionUIObjects();
            $rootScope.addMessage($rootScope.createSuccessDeleteMessage(response.getMessage()));
        }, function(responseError) {
            $rootScope.addMessage($rootScope.createErrorMessage(responseError.getMessage()));
        });

        $state.go('modules.detail.questions.blank');
    };

    $scope.sortableOptions = {
        update: function(e, ui) {
            var logEntry = tmpList.map(function(i){
                return i.value;
            }).join(', ');
            // $scope.sortingLog.push('Update: ' + logEntry);
        },
        stop: function(e, ui) {
            // this callback has the changed model
            var logEntry = tmpList.map(function(i){
                return i.value;
            }).join(', ');
            //$scope.sortingLog.push('Stop: ' + logEntry);
        }
    };
}]);