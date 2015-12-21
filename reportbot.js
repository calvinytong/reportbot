/**
 * reportbot.js
 *
 * Created by Calvin Tong on 11/10/15
 * Updated by Joseph Zhong on 12/20/15
 *
 *
 * This is the ReportBot.
 * Implementation and interaction involves invoking a Heroku-deployed Nodejs
 * application, updating and reading a ParseDB for people and reports,
 * parsing a slack message, determining whether the message is a report
 * invocation, and then appropriately message that person's new report count.
 *
 * Example Invocation:
 *    report Joseph
 *    >> Joseph has been reported 65 times
 *
 * Current known issues:
 *    Slack on mobile causes syntax errors because of an extra space (11/20)
 *    Isotopes refactored to uppercase form -- should be lowercase (12/20)
 *
 **/
var Parse = require('parse/node').Parse;

// TODO: Either hash these, or remove them from the Git repo
// and deploy a separate version. Create a bash file to retrieve
// these from a more secure location, or decrypt the hashes
Parse.initialize('Axdkivzv1VVEHR1hNoW1EWHWEU6Wa2zRX4wuZE5j',
    'VquKxvYVQy53966m0MLb63dMhADHSMDCjLpgRZOf');

const COMMEND_COMMAND = 'commend';
const REPORT_COMMAND = 'report';
const PEOPLE_TABLE = 'People';
const People = Parse.Object.extend(PEOPLE_TABLE);
module.exports = function (req, res, next) {
    var text = req.body.text;
    var tokens = text.trim().replace(/\s+/g, ' ').split(' ');
    var reportIndex = tokens.indexOf(REPORT_COMMAND);

    // we can assume that report or commend is at the beginning
    // due to slack's app integration requirements
    var commendOrReport = (reportIndex == 0 ? 1 : reportIndex);
    // follows report syntax, and does not cause looping
    if((tokens[0].toLowerCase() == REPORT_COMMAND
            || tokens[0].toLowerCase() == COMMEND_COMMAND)
            && tokens.length >= 2
            && tokens[1]
            && tokens[1] != COMMEND_COMMAND
            && tokens[1] != REPORT_COMMAND) {
        var peopleQuery = new Parse.Query(People);
        var personName = tokens[1].toLowerCase();
        peopleQuery.equalTo('name', personName);
        peopleQuery.include('reportsPerDay');
        peopleQuery.find({
            success: function(people) {
                if(people.length == 0) {
                    var newPerson = new People();
                    newPerson.set('name', personName);
                    newPerson.set('reports', commendOrReport);
                    newPerson.set('reportsPerDay', '[{\"date\" : ' + Date.now() + ', ' +
                                                    '\"reports\" : ' + commendOrReport + '}]');
                    if(commendOrReport > 0) { // negative is commending
                        newPerson.save(null, {
                            success: function(object) {
                                var botPayload = {
                                    text : personName + ' has been reported 1 time'
                                }
                                return res.status(200).json(botPayload);
                            },
                            // hello gameScore :moo:
                            error: function(gameScore, error) {
                                console.log('Failed to create new object, with error code: '
                                    + error.message);
                            }
                        });
                    }
                    else {
                        newPerson.save(null, {
                            success: function(object) {
                                var botPayload = {
                                    text : personName + ' has been commended 1 time'
                                }
                                return res.status(200).json(botPayload);
                            },
                            error: function(gameScore, error) {
                                console.log('Failed to create new object, with error code: '
                                    + error.message);
                            }
                        });
                    }
                }
                else if(people.length > 0) {
                    var reportee = people[0];
                    var reports = reportee.get('reports') + commendOrReport;
                    reportee.set('reports', reports);
                    var array = JSON.parse(reportee.get('reportsPerDay'));
                    array.push({'date' : Date.now(), 'reports' : reports});
                    reportee.set('reportsPerDay', array);
                    if(reports > 0) {
                        reportee.save(null, {
                            success: function(object){
                                var botPayload = {
                                    text : personName + ' has been reported ' + reports + ' times'
                                };
                                return res.status(200).json(botPayload);
                            },
                            error: function(object) {
                                console.log('failed to create object');
                            }
                        });
                    }
                    else { // negative reports is commending
                        reportee.save(null, {
                            success: function(object){
                                var botPayload = {
                                    text : personName + ' has been commended ' + -reports + ' times'
                                };
                                return res.status(200).json(botPayload);
                            },
                            error: function(object) {
                                console.log('failed to create object');
                            }
                        });
                    }

                }
            },
            error: function(error) {
                console.log('Error: ' + error.code + ' ' + error.message);
            }
        });
    }
    else { //if wrong syntax put back
        var botPayload = {
            text : 'that is not how you report people'
        };
        return res.status(200).json(botPayload);
    }
}

/**
 * To Title Case Converter
 * Credits to Greg Dean and Bill the Lizard
 * http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript/196991#196991
 * Another suggested RegEx to try out: '/\b\w+/g' */
function toTitleCase(str) {
    return str.replace(/\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
}

/**
 * Report or Commend Increment or Decrement
 * @param report
 * @returns {number} */
function reportOrCommend(report) {
    if(report) {
        return 1;
    }
    else {
        return -1;
    }
}