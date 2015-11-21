/**
 * reportbot.js
 * 
 * Created by Calvin Tong
 * Last updated on 11/20/2015 by Joseph Zhong
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
 *    Isotopes of names are not handled, and creates a new DB Entity (11/20)
 *     
 **/
var Parse = require('parse/node').Parse;
// TODO: Either hash these, or remove them from the Git repo 
// and deploy a separate version. Create a bash file to retrieve 
// these from a more secure location, or decrypte the hashes
Parse.initialize('Axdkivzv1VVEHR1hNoW1EWHWEU6Wa2zRX4wuZE5j', 
    'VquKxvYVQy53966m0MLb63dMhADHSMDCjLpgRZOf');

module.exports = function (req, res, next) {
  var text = req.body.text.trim();
  var tok = text.split(' ');
  console.log('Slack message: ' + tok);
  //if wrong syntax put back
  if(tok[0].toLowerCase() !== 'report'){
    var botPayload = {
      text : 'that is not how you report people'
    };
    return res.status(200).json(botPayload);
  }

  var People = Parse.Object.extend('People');
  var query = new Parse.Query(People);
  query.equalTo('name', tok[1]);
  query.find({
  success: function(people) {
    if(people.length == 0) {
      var object = new People();
      object.set('name', tok[1]);
      object.set('reports', 1);
      object.save(null, {
        success: function(object) {
          var botPayload = {
            text : tok[1] + ' has been reported 1 time'
          }
          return res.status(200).json(botPayload);
        },
        error: function(gameScore, error) {
          alert('Failed to create new object, with error code: ' + error.message);
        }
    });
    }
    else{
      var reportee = people[0];
      var reports = reportee.get('reports') + 1;
      reportee.set('reports', reports);
      reportee.save(null, {
        success: function(object){
        },
        error: function(object){
          alert('failed to create object');
        }
      });
      var botPayload = {
        text : tok[1] + ' has been reported ' + reports + ' times'
      };
      return res.status(200).json(botPayload);
    }
  },
  error: function(error) {
    alert('Error: ' + error.code + ' ' + error.message);
  }
  });
}


/**
 *
 *
 *
 **/
function toTitleCase(str)
{
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}