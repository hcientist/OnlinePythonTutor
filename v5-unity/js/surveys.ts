// deployed on 2017-05-15:
var eureka_survey_v1 = `
  <div id="eureka_survey" style="text-align: center; margin-top: 10px; margin-bottom: 15px;">
    <div style="margin-bottom: 6px;">Support our research by clicking below whenever you learn something:</div>
    <button class="surveyBtnBig" type="button">I just cleared up a misunderstanding!</button>
    <button class="surveyBtnBig" type="button" style="margin-left: 12px;">I just fixed a bug in my code!</button>
  </div>
`;
var eureka_prompt_v1 = "What was your misunderstanding or error? (Press 'OK' to submit)";

// deployed on 2017-05-20:
/*
var eureka_survey_v2 = `
  <div id="eureka_survey" style="text-align: center; margin-top: 10px; margin-bottom: 15px;">
    <div style="margin-bottom: 6px;">Help us improve this tool by clicking below whenever you learn something:</div>
    <button class="surveyBtnBig" type="button">I just cleared up a misunderstanding!</button>
    <button class="surveyBtnBig" type="button" style="margin-left: 8px;">I just fixed a bug in my code!</button>
  </div>
`;
*/

// a SMALLER variant of eureka_survey_v2, deployed on 2018-03-15
var eureka_survey_v2 = `
  <div id="eureka_survey" style="text-align: center; margin-top: 10px; margin-bottom: 15px;">
    <div style="margin-bottom: 6px;">Help improve this tool by clicking whenever you learn something:</div>
    <button class="smallBtn" type="button">I just cleared up a misunderstanding!</button>
    <button class="smallBtn" type="button" style="margin-left: 8px;">I just fixed a bug in my code!</button>
  </div>
`;

var eureka_prompt_v2 = "What was your misunderstanding or error? (Press 'OK' to submit)";

// adjust as versions increase ...
export var eureka_survey_version = 'v2';
export var eureka_survey = eureka_survey_v2;
export var eureka_prompt = eureka_prompt_v2;
