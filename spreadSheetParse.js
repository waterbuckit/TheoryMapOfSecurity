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
    uploadReferentObjects();
    recordsCount = records.length;
    console.log("Inserting theories");
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
            "VALUES (?,?,?,?,?,?,?,"+
            "(SELECT id FROM referentobjects WHERE referentObject = ?)"+
            ",?,?,?,?,?,?,?,?,?,?,?)";
        insertTheory = db.format(insertTheory, 
            [
                record.theoryID, 
                record.theoryName, 
                record.theorySummary, 
                record.theoryPrinciples, 
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
                    .trim();
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
    setupTheoryRelations();
}
function uploadReferentObjects(){
    console.log("Uploading referent objects");
    var unfilteredArray =[];
    records.forEach(function(record){
        unfilteredArray.push(record.theorySecurityReferentObject);
    });
    var filtered = unfilteredArray.filter(onlyUnique);
    for(referentobject of filtered){
        conn.query("INSERT INTO referentobjects(referentObject) VALUES (?)",
            [referentobject]
        );
    }
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function setupTheoryRelations(){
    console.log("Establishing theory relations");
    records.forEach(function(record){
        if(record.theoryRelatedTo == "null"){
            return;
        }
        var currentTheoryIDQuery = "SELECT id FROM theories WHERE theoryName = ?";
        currentTheoryIDQuery = db.format(currentTheoryIDQuery, record.theoryName);
        var currentTheoryID = conn.query(currentTheoryIDQuery)[0].id;
        var relatedTo = record.theoryRelatedTo.split(",");
        for(related of relatedTo){
            related = related.trim();
            conn.query("INSERT INTO theoryRelations(theoryID, theoryID2)"+
                " VALUES (?, (SELECT id FROM theories WHERE "+
                "theoryName = ?))", [currentTheoryID, related]);
        }
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
            "logicsNegativeSecurity, logicsUniversalist,"+
            "logicsExemplars, logicsReferences, logicsOppositeLogic,"+
            "logicsCloselyRelated) VALUES"+
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
                logic.logicsExemplars, 
                logic.logicsReferences,
                logic.logicsOppositeLogic,
                logic.logicsCloselyRelated
            ]
        );
    });
    logics.forEach(function(logic){
        var currentLogicIDQuery = "SELECT id FROM logics WHERE logicsName = ?";
        currentLogicIDQuery = db.format(currentLogicIDQuery, [logic.logicsName]);
        var currentLogicID = conn.query(currentLogicIDQuery)[0].id;
        var relatedTo = logic.logicsCloselyRelated.split(",");
        for(related of relatedTo){
            related = related.trim();
            var relationsQuery = "INSERT INTO logicsRelations(logicID1, logicID2) VALUES (?, ("+
                "SELECT id FROM logics WHERE logicsName = ?))";
            conn.query(relationsQuery, [currentLogicID, related]);
        }
        var oppositeTo = logic.logicsOppositeLogic.split(",");
        for(opposite of oppositeTo){
            opposite = opposite.trim();
             var oppositesQuery = "INSERT INTO logicsOpposite(logicId, logicIdOpposite) VALUES (?, ("+
                "SELECT id FROM logics WHERE logicsName = ?))";
            conn.query(oppositesQuery, [currentLogicID, opposite]);
        }
    });
    console.log("Logics inserted");
}

function setup(){
    conn.query("DELETE FROM referentobjects");
    conn.query("DELETE FROM theoryRelations");
    conn.query("DELETE FROM logicsOpposite");
    conn.query("DELETE FROM logicsRelations");
    conn.query("DELETE FROM logicMapping");
    conn.query("DELETE FROM logics");
    conn.query("DELETE FROM theories");
    conn.query("DELETE FROM keywords");
    conn.query("DELETE FROM keywordMapping");
    conn.query("ALTER TABLE referentobjects AUTO_INCREMENT = 1");
    conn.query("ALTER TABLE logics AUTO_INCREMENT = 1");
    conn.query("ALTER TABLE keywords AUTO_INCREMENT = 1");
    conn.query("ALTER TABLE theories AUTO_INCREMENT = 1");
    console.log("Cleared tables...");
}
