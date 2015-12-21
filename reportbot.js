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
    var text = req.body.text.trim().replace(/\s+/g, ' ');
    var tokens = text.split(' ');
    var reportIndex = text.indexOf(REPORT_COMMAND);
    var commendIndex = text.indexOf(COMMEND_COMMAND);
    if(reportIndex || commendIndex) {
        if(index + 1 < tokens.length && tokens[index + 1]) {
            this.attemptMessage(tokens[index + 1], reportIndex);
        }
        else { //if wrong syntax put back
            var botPayload = {
                text : 'that is not how you report people'
            };
            return res.status(200).json(botPayload);
        }
    }
    console.log('Slack message: ' + tok);
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
 * Message constructor
 * @param toReport */
function attemptMessage(toReport, report) {
    var peopleQuery = new Parse.Query(People);
    var personName = toReport.toLowerCase();
    peopleQuery.equalTo('name', personName);
    peopleQuery.find({
        success: function(people) {
            if(people.length == 0) {
                var newPerson = new People();
                newPerson.set('name', personName);
                newPerson.set('reports', 1);
                newPerson.save(null, {
                    success: function(object) {
                        var botPayload = {
                            text : personName + ' has been reported 1 time'
                        }
                        return res.status(200).json(botPayload);
                    },
                    error: function(gameScore, error) {
                        console.log('Failed to create new object, with error code: '
                            + error.message);
                    }
                });
            }
            else {
                var reportee = people[0];
                var reports = reportee.get('reports') + this.reportOrCommend(report);
                reportee.set('reports', reports);
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
                                text : personName + ' has been commended ' + reports + ' times'
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