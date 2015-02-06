(function() {
    'use strict';

    angular.module('Editors').controller('ModulesDetailController', ['$scope', '$state', '$stateParams', 'survey', 'surveySections', 'surveyPages', 'SurveyService', 'SurveyPageService', 'Question', 'MessageFactory', function($scope, $state, $stateParams, survey, surveySections, surveyPages, SurveyService, SurveyPageService, Question, MessageFactory){

        $scope.survey = survey;
        $scope.surveyPages = surveyPages;
        $scope.surveySections = surveySections;
        $scope.alerts = MessageFactory.get();

		// Add displayOrder to questions
		_.each($scope.surveyPages, function(page) {
			_.each(page.questions, function(question, index) {
				question.displayOrder = index + 1;
			});
		});

        $scope.sortablePageOptions = {
            'ui-floating': false,
            cancel: '.unsortable',
            items: 'li:not(.unsortable)',
            stop: function(e, ui) {
				_.each($scope.surveyPages, function(page, index) {
					page.pageNumber = index + 1;
				});
            }
        };

        $scope.sortableQuestionOptions = {
            'ui-floating': false,
            cancel: '.unsortable',
            items: 'li:not(.unsortable)',
            stop: function(e, ui) {
                // Update the display order
                var questions = ui.item.scope().$parent.page.questions;
				_.each(questions, function(question, index) {
                    question.displayOrder = index + 1;
                });
            }
        };

        $scope.addPage = function addPage() {
            var page = SurveyService.one($scope.survey.id).one('pages');
            page.title = $scope.survey.surveySection.name | $scope.survey.name;
            page.description = $scope.survey.name + ' page';
            page.pageNumber = $scope.surveyPages.length + 1;
            $scope.surveyPages.push(page);
        };

        $scope.deletePage = function deletePage(index) {
            $scope.surveyPages.splice(index, 1);
        };

        $scope.addQuestion = function addQuestion(page) {
            $scope.question = Question.extend({displayOrder: page.questions.length + 1});
            page.questions.push($scope.question);
            $state.go('modules.detail.list');
        };

        $scope.getStateName = function getStateName(selectedStateName){
            var stateName;

            switch (selectedStateName){
                case 'freeText':
                    stateName = "modules.detail.question.text";
                    break;
                case 'selectOne':
                    stateName = "modules.detail.question.simple";
                    break;
                case'selectMulti':
                    stateName = "modules.detail.question.simple";
                    break;
                case 'selectOneMatrix':
                    stateName = "modules.detail.question.matrix";
                    break;
                case 'selectMultiMatrix':
                    stateName = "modules.detail.question.matrix";
                    break;
                case 'tableQuestion':
                    stateName = "modules.detail.question.table";
                    break;
                case 'instruction':
                    stateName = "modules.detail.question.instructions";
                    break;
                default:
                    stateName = "modules.detail.question.text";
            }

            return stateName;
        };

        $scope.editQuestion = function editQuestion(page, question){
            var stateName = $scope.getStateName(question.type);

            // Deselect all questions
            _.each(page.questions, function(question) {
                question.selected = false;
            });

            if(Object.isDefined(stateName)) {
                // Set selected on current question
                question.selected = true;

                $scope.question = question;
                $state.go(stateName, {questionId: question.id});
            }
        };

        $scope.deleteQuestion = function deleteQuestion(page, index){
            page.questions.splice(index, 1);
			$state.go('modules.detail', {surveyId: $stateParams.surveyId});
        };

        $scope.save = function () {

            $scope.survey.save().then(function(survey) {
                MessageFactory.set('success', 'The ' + survey.name + ' module has been saved successfully.', false, true);

                _.each($scope.surveyPages, function(page) {
                    page.parentResource.id = survey.id;

                    // Only save new pages with at least one question
                    if (page.questions.length) {
                        // Deselect all questions: Server threw an error saying "selected" is not marked as ignorable
                        _.each(page.questions, function (question) {
                            delete question.selected;
                        });

                        page.save().then(function (updatedPage) {
                            // Update the id of each question with the persisted question ID.
                            // Questions are not a nested resource and therefore restangular won't
                            // update the question IDs automatically like it does for actual resources
                            _.each(updatedPage.questions, function (question, index) {
                                page.questions[index].id = question.id;
                                // Same holds true for childQuestions
                                _.each(question.childQuestions, function(childQuestion, j) {
                                    page.questions[index].childQuestions[j].id = childQuestion.id;
                                });
                            });

							$state.go('modules.detail', { surveyId: survey.id });

                        }, function (response) {
                            MessageFactory.error('There was an error saving module items.', true);
                        });
                    } else {
						if (page.id) {
							// Save the page due to constraint on deleted question
							page.save().then(function() {
								// Delete the page
								var index = page.pageNumber - 1;
								page.remove().then(function() {
									// Remove page from surveyPages array
									$scope.surveyPages.splice(index, 1);
								});
							});

						} else {
							MessageFactory.warning('Page items require a minimum of one question.', true);
						}
                    }
                });

                if (!$stateParams.surveyId) {
                    $state.go('modules.detail', { surveyId: survey.id });
                }

            }, function(response) {
                MessageFactory.set('danger', 'There was an error saving the module.', false, true);
            });
        };

        $scope.cancel = function cancel(moduleDetailsForm) {
            if (!moduleDetailsForm.$dirty || (moduleDetailsForm.$dirty && window.confirm("Would you like to discard all of your changes?"))) {
                $state.go('modules');
            }
        };

    }]);
})();

