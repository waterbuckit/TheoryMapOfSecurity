var parse = require('csv-parse/lib/sync');
var db = require('mysql');
var DB = require('sync-mysql');
var fs = require('fs');

var logicsInput;
var input;
try{
    input = fs.readFileSync('theories.csv', 'utf8');
    logicsInput = fs.readFileSync('logics.csv', 'utf8');
}catch(e){
    console.log("ERROR: Please check that both logics.csv and theories.csv are in the current working directory");
    process.exit(1);
}

var logics = parse(logicsInput, {columns: true});
var records = parse(input, {columns: true});

var conn = new DB({
    host: 'localhost',
    user: 'AdamTest',
    password: 'AdamTest',
    database: 'SecurityTheoryMap'
});

uploadToDB();

function uploadToDB(){  
    setup();
    uploadLogics();
    uploadGroups();
    recordsCount = records.length;
    records.forEach(function(record){
        // ignore theories with all empty values
        if(record.theoryName == null){
            recordsCount--;
            console.log((100-((recordsCount/records.length)*100))
                .toFixed(2) + "%");
            return;
        }
        var insertTheory = "INSERT INTO theories "+
            "(theoryID,theoryName,theorySummary,theoryPrinciples,"+
            "theoryExample,theoryStructureOfTheInternationalSystem,"+
            "theoryRelationOfSystemToEnvironment,theorySecurityReferentObject,"+
            "theoryAgent,"+ 
            "theoryThreatActors,theorySourceOfResilience,"+
            "theoryInterventions,theoryStrategy,theoryPrimaryAuthors,"+
            "theoryYear,theoryLimitations,theoryAudience,"+
            "theoryResearchDrawnUpon,idTheoryGroupIndex)" + 
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        insertTheory = db.format(insertTheory, 
            [
                record.theoryID, 
                record.theoryName, 
                record.theorySummary, 
                record.theoryPrinciples, 
                record.theoryTags, 
                record.theoryExample, 
                record.theoryStructureOfTheInternationalSystem, 
                record.theoryRelationOfSystemToEnvironment,
                record.theorySecurityReferentObject,
                record.theoryAgent, 
                record.theoryThreatActors, 
                record[' theorySourceOfResilience'], 
                record.theoryInterventions, 
                record.theoryStrategy, 
                record.theoryPrimaryAuthors, 
                record.theoryYear.includes("B.C.E") ? "-"+record.theoryYear : record.theoryYear, 
                record.theoryLimitations,
                record.theoryAudience,
                record.theoryResearchDrawnUpon,
                record.idTheoryGroupIndex
            ]);
        conn.query(insertTheory);
        conn.query("UPDATE theories SET theoryGroupIndex = "+
            "(SELECT id FROM groups WHERE groupName = \""+record.theoryGroupIndex+"\") "+
            "WHERE id = (SELECT LAST_INSERT_ID())");
        // Map to logic
        var theoryLogics = record.theoryLogics.split(",");
        var theoryInsertId = conn.query("SELECT LAST_INSERT_ID()");
        theoryInsertId = theoryInsertId[0]['LAST_INSERT_ID()'];
        for(logic of theoryLogics){
            logic = logic.trim();
            conn.query("INSERT INTO logicMapping(theoryID, logicID)"+
                "VALUES(?, (SELECT id FROM logics WHERE logicsName = \""+logic+"\"))", [theoryInsertId]);
        }
        if(record.theoryTags){
            tags = record.theoryTags
                .split(",");
            for(tag of tags){
                tag = tag
                    .toLowerCase()
                    .replace(/[.,\/#!\$%\^&\*;\':{}=\_`~]/g, "")
                    .replace(/\s/g,"");
                var insertTag = "INSERT IGNORE INTO keywords(keyword) VALUES (?)";
                insertTag = db.format(insertTag, tag);
                conn.query(insertTag); 
                var insertMapping = "INSERT INTO keywordMapping(theoryId, keywordId) "+
                    "VALUES(?, (SELECT id FROM keywords WHERE keyword = ?))";
                insertMapping = db.format(insertMapping, [theoryInsertId, tag]);
                conn.query(insertMapping);
            }
        }
        recordsCount--;
        console.log((100-((recordsCount/records.length)*100))
            .toFixed(2) + "%");
    });
    conn.dispose();
    console.log("Upload complete!");
}

function uploadGroups(){
    records.forEach(function(record){
        if(record.theoryCluster == ''){
            return;
        }
         conn.query("INSERT IGNORE INTO groups(groupName) VALUES (?)",
             [record.theoryGroupIndex]);
    });
    console.log("Uploaded groups!");
}

function uploadLogics(){
    logics.forEach(function(logic){
        if(logic.logicsID == ''){
            return;
        }
        var query = "INSERT INTO logics(logicsID, logicsName,"+
            "logicsSummary, logicsCommentary, logicsObjects,"+
            "logicsPolitics, logicsTechnology, logicsPositiveSecurity,"+
            "logicsNegativeSecurity, logicsUniversalist, logicsOppositeLogic,"+
            "logicsCloselyRelated,logicsExemplars, logicsReferences) VALUES"+
            "(?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        conn.query(query,
            [
                logic.logicsID,
                logic.logicsName,
                logic.logicsSummary, 
                logic.logicsCommentary, 
                logic.logicsObjects, 
                logic.logicsPolitics, 
                logic.logicsTechnology, 
                logic.logicsPositiveSecurity,
                logic.logicsNegativeSecurity,
                logic.logicsUniversalist, 
                logic.logicsOppositeLogic,
                logic.logicsCloselyRelated, 
                logic.logicsExemplars, 
                logic.logicsReferences
            ]
        );
    });
    console.log("Logics inserted");
}

function setup(){
    conn.query("DELETE FROM logicMapping");
    conn.query("DELETE FROM logics");
    conn.query("DELETE FROM theories");
    conn.query("DELETE FROM keywords");
    conn.query("DELETE FROM keywordMapping");
    conn.query("ALTER TABLE logics AUTO_INCREMENT = 1");
    conn.query("ALTER TABLE keywords AUTO_INCREMENT = 1");
    conn.query("ALTER TABLE theories AUTO_INCREMENT = 1");
    console.log("Cleared tables...");
}
