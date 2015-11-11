var Parse = require('parse/node').Parse;
Parse.initialize("Axdkivzv1VVEHR1hNoW1EWHWEU6Wa2zRX4wuZE5j", "VquKxvYVQy53966m0MLb63dMhADHSMDCjLpgRZOf");

module.exports = function (req, res, next) {
  var text = req.body.text;
  var tok = text.split(" ");
  console.log(tok);
  //if wrong syntax put back
  if(tok.length != 2){
    var botPayload = {
      text : "that is not how you report people"
    };
    return res.status(200).json(botPayload);
  }
  var People = Parse.Object.extend("People");
  var query = new Parse.Query(people);
  query.equalTo("name", tok[1]);
  query.find({
  success: function(people) {
    if(people.length == 0){
      var object = new People();
      object.set("name", tok[1]);
      object.set("reports", 1);
      object.save(null, {
        success: function(object) {
          var botPayload = {
            text : tok[1] + " has been reported 1 time"
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
      var reports = reportee.get("reports") + 1;
      reportee.set("reports", reports);
      reportee.save(null, {
        success: function(object){
        },
        error: function(object){
          alert("failed to create object");
        }
      });
      var botPayload = {
        test : tok[1] + "has been reported " + reports + " times"
      };
      return res.status(200).json(botPayload);
    }
  },
  error: function(error) {
    alert("Error: " + error.code + " " + error.message);
  }
  });
}
