var db = require("./db");
var fs = require("fs");

var toWrite = "theoryCluster,theoryID,theoryName,theorySummary,theoryPrinciples,theoryTags,theoryExample,theoryStructureOfTheInternationalSystem,theoryRelationOfSystemToEnvironment,theorySecurityReferentObject,theoryAgent,theoryThreatActors,theorySourceOfResilience,theoryInterventions,theoryStrategy,theoryPrimaryAuthors\n";

db.query("SELECT * FROM theories", function(err, rows){
    if(err) throw err;
    var theories = rows;
    for(row of rows){
        toWrite += ","+row.spreadsheetID+","+row.name+",\""+
            row.summary+"\",\""+row.principles+"\","+
            getTags(row.id,function(tags){return tags})+
            row.example+",\""+row.structure+"\",\""+row.relationOfSysToEnvironment+
            "\",\""+row.referent+"\",\""+row.agent+"\",\""+
            row.threatActors+"\",\""+row.sourceOfResilience+
            "\",\""+row.interventions+"\",\""+row.strategy+"\",\""+
            row.primaryAuthors+"\","+row.year+",\""+row.limitations+"\"\n"; 
    }
    fs.writeFile('theoryExport.csv', toWrite, function(err){
        if (err) throw err;
        console.log("Exported!");
    });
    db.end();
});
function getTags(id, callback){
   db.query("SELECT keyword FROM keywords where id IN"+
       "(SELECT keywordId FROM keywordMapping WHERE theoryId = ?)", id,
       function(err, res){
           if(err) throw err;   
           var tags = "\"";
           for(row in res){
               tags += row.keyword +","; 
           }
           tags += "\",";
           callback(tags);
       });
}
