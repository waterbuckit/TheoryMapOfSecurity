var bodyParser = require('body-parser');
var express = require('express');
var db = require("./db");
var fs = require("fs");
var session = require('express-session');
var passport = require('passport');
var urlParser = bodyParser.urlencoded({extended: false});
var app = express();
var server = app.listen(25565);
app.set('view engine','ejs');
app.use(express.static('views/public'));

app.get("/theoryForm", function(req, res){
    db.query("SELECT groupName FROM groups", function(err, rows, fields){
        res.render("./private/theoryForm", {rows: rows});
    });
});

app.get("/map", function(req, res){
    res.render("./public/map");
});
app.get("/getlogicidsandnames", function(req,res){
    db.query("SELECT logicsName, id FROM logics", function(err, rows, fields){
        res.send(rows); 
    });
});

app.post("/gettheoriesbylogicsTimeline", urlParser, function(req, res){
    db.query("SELECT theories.theoryName, theories.theoryYear, theories.theoryGroupIndex, theories.id as theoryID"+
        " from theories where theories.id IN (SELECT theoryID from logicMapping "+
        " WHERE logicID IN (?)) AND theories.theoryGroupIndex != (SELECT id from groups where groupName = 'Antecedents') ORDER BY theories.theoryYear ASC", 
        [req.body["ids[]"]],
        function(err,rows,fields){
            res.send(rows);
    });
});
app.post("/gettheoriesbytheoriesinnerjoin", urlParser, function(req, res){
    db.query("select theories.id as theoryID, logics.logicsName, logics.id as logicsID from logicMapping INNER JOIN theories ON logicMapping.theoryID = theories.id INNER JOIN logics ON logicMapping.logicID = logics.id "+
        " WHERE theories.id IN (?)",
        [req.body["ids[]"]],
        function(err, rows, fields){
            res.send(rows);
    }); 
});
app.post("/gettheoriesbylogics", urlParser, function(req, res){
    db.query("SELECT theories.theoryName, theories.theoryYear,theories.theorySecurityReferentObject, theories.theoryGroupIndex, theories.theorySummary, theories.id as theoryID"+
        " from theories where theories.id IN (SELECT theoryID from logicMapping "+
        " WHERE logicID IN (?)) ORDER BY theories.theoryYear ASC", 
        [req.body["ids[]"]],
        function(err,rows,fields){
            res.send(rows);
    });
});
app.post("/gettheoriesbylogicsantecedents", urlParser, function(req, res){
    db.query("SELECT theories.theoryName, theories.theoryYear, theories.id AS theoryID"+
        " FROM theories where theories.id IN (SELECT theoryID from logicMapping"+
        " WHERE logicID IN (?)) AND theories.theoryGroupIndex = (SELECT id from groups where groupName = 'Antecedents') ORDER BY theories.theoryYear ASC", 
        [req.body["ids[]"]],
        function(err,rows,fields){
            res.send(rows);
    });
});
var importantQuery = "select theories.theoryName as theory, logics.logicsName as logic from logicMapping INNER JOIN theories ON logicMapping.theoryID = theories.id INNER JOIN logics ON logicMapping.logicID = logics.id"; 
app.post("/gettheoriesbylogics", urlParser, function(req, res){
    // Check if they selected multiple
    if(req.body.logic.constructor === Array){
        var logics = "'"+req.body.logic.join("','")+"'";
    }else{
        var logics = "'"+req.body.logic+"'";
    }
    db.query("SELECT theoryID FROM logicMapping WHERE logicID "+
        "IN ("+logics+")",
        function(err, theoryIDs, fields){
            res.render("./public/map", { theoryIDs : theoryIDs });
        });
});

app.post("/getlogicsummary", urlParser, function(req, res){
    db.query("SELECT logicsSummary FROM logics where id = ?", 
        req.body.id,
        function(err, rows, fields){
            res.send(rows[0]);
        });
});
app.post("/gettheorysummary", urlParser, function(req, res){
    db.query("SELECT theorySummary FROM theories where id = ?", 
        req.body.id,
        function(err, rows, fields){
            res.send(rows[0]);
        });
});


app.post("/gettheoriesbykeywordsTimeline", urlParser, function(req, res){
    db.query("SELECT theories.theoryYear, theories.theoryName, theories.theoryGroupIndex,theories.id AS theoryID FROM theories WHERE id IN (SELECT theoryId from keywordMapping WHERE keywordId in (?)) AND id IN (SELECT theoryID from logicMapping where logicID in (?)) AND theories.theoryGroupIndex != (SELECT id from groups where groupName = 'Antecedents') ORDER BY theories.theoryYear ASC",
        [req.body["keywords[]"], req.body["logicIds[]"]],
        function(err, rows, fields){
            res.send(rows);
        });
});
app.post("/gettheoriesbykeywords", urlParser, function(req, res){
    db.query("SELECT theories.theoryYear, theories.theoryName, theories.theorySecurityReferentObject, theories.theorySummary, theories.theoryGroupIndex ,theories.id AS theoryID FROM theories WHERE id IN (SELECT theoryId from keywordMapping WHERE keywordId in (?)) AND id IN (SELECT theoryID from logicMapping where logicID in (?)) ORDER BY theories.theoryYear ASC",
        [req.body["keywords[]"], req.body["logicIds[]"]],
        function(err, rows, fields){
            res.send(rows);
        });
});

app.post("/gettheoriesbykeywordsantecedents", urlParser, function(req, res){
    db.query("SELECT theories.theoryYear, theories.theoryName, theories.id AS theoryID FROM theories WHERE id IN (SELECT theoryId from keywordMapping WHERE keywordId in (?)) AND id IN (SELECT theoryID from logicMapping where logicID in (?)) AND theories.theoryGroupIndex = (SELECT id from groups where groupName = 'Antecedents') ORDER BY theories.theoryYear ASC",
        [req.body["keywords[]"], req.body["logicIds[]"]],
        function(err, rows, fields){
            res.send(rows);
        });
});
app.get("/gettheories", function(req, res){
    db.query("SELECT id as theoryID, theoryName, theoryGroupIndex, theorySecurityReferentObject, theorySummary from theories",
        function(err, rows, fields){
            res.send(rows);
        });
});
app.post("/getkeywordsbyinput", urlParser, function(req, res){
    db.query(
        "SELECT keyword, id from keywords WHERE keyword LIKE ? " +
        "UNION " +
        "SELECT keyword, id from keywords WHERE keyword LIKE ? LIMIT 20", 
    [req.body.keyword+"%", "%"+req.body.keyword+"%"], function(err, rows,fields){
        res.send(rows);
    });
});
app.get("/getreferentobjects", function(req, res){
    db.query("SELECT id, referentObject FROM referentobjects", 
        function(err, rows, fields){
           res.send(rows); 
        });
});
app.post("/getRelationshipToTheories", urlParser, function(req, res){
    db.query("SELECT id as theoryID, theoryGroupIndex, theorySecurityReferentObject from theories where theorySecurityReferentObject = ?",
        req.body.id,
        function(err, rows, fields){
            res.send(rows);
        });
});
app.post("/getRelationship", urlParser, function(req, res){
    db.query("SELECT theories.theoryYear,theories.theorySecurityReferentObject, theories.theoryGroupIndex, theories.id as theoryID, logics.id as logicID from logicMapping INNER JOIN theories ON logicMapping.theoryID = theories.id INNER join logics on logicMapping.logicID = logics.id WHERE theories.id IN (?) ORDER BY theories.theoryYear ASC",
        req.body.id,
        function(err, rows, fields){
            res.send(rows);
        });
});
app.post("/getRelationships", urlParser, function(req, res){
    db.query("SELECT theories.theoryYear,theories.theoryGroupIndex, theories.id as theoryID, logics.id as logicID from logicMapping INNER JOIN theories ON logicMapping.theoryID = theories.id INNER join logics on logicMapping.logicID = logics.id WHERE theories.id IN (?) and logics.id IN (?) ORDER BY theories.theoryYear ASC",
        [req.body["ids[]"], req.body["logicIds[]"]],
        function(err, rows, fields){
            res.send(rows);
        });
});
app.get("/getPosNegAll", urlParser, function(req, res){
    db.query("SELECT theories.id as theoryID, logics.logicsPositiveSecurity, logics.logicsNegativeSecurity, logics.id as logicID from logicMapping INNER JOIN theories ON logicMapping.theoryID = theories.id INNER join logics on logicMapping.logicID = logics.id",
        function(err, rows, fields){
            res.send(rows); 
        });
});
app.post("/getPosNeg", urlParser, function(req, res){
    db.query("SELECT theories.id as theoryID, theories.theoryGroupIndex, theories.theorySecurityReferentObject, logics.logicsPositiveSecurity, logics.logicsNegativeSecurity, logics.id as logicID from logicMapping INNER JOIN theories ON logicMapping.theoryID = theories.id INNER join logics on logicMapping.logicID = logics.id WHERE logics.id IN (?) AND theories.id IN (?)",
        [req.body["logicIds[]"], req.body["ids[]"]],
        function(err, rows, fields){
            res.send(rows); 
        });
});
app.get("/logicSelect", function(req, res){
    db.query("SELECT logicsName,id,logicsSummary,logicsCommentary,"+
        "logicsObjects,logicsPolitics,logicsTechnology,logicsPositiveSecurity,"+
        "logicsNegativeSecurity"
        + ",logicsUniversalist,logicsExemplars,logicsReferences FROM logics", 
        function(err, logicsRows, fields){
            res.render("./public/logicSelect", {logics : logicsRows});
    });
});

app.get("/", function(req, res){
    db.query("SELECT id, theoryName FROM theories", function(err, rows, fields){
        res.render("./public/index", {theories: rows}); 
    });
});

// returns the theories in date order
app.post("/getorderedtheories",urlParser,function(req, res){
    var isEmpty = false;
    if(typeof req.body["ids[]"] !== 'undefined'){
        if(req.body["ids[]"].constructor === Array){
            var theoryIDs = "'"+req.body["ids[]"].join("','")+"'";
        }else{
            var theoryIDs = "'"+req.body["ids[]"]+"'";
        }
    }else{
        isEmpty = true;
    }
    if(!isEmpty){
        db.query("SELECT theories.theoryName, theories.theoryYear, theories.id as theoryID,"+
            "logics.logicsName, logics.id as logicID from logicMapping "+
            "INNER JOIN theories ON logicMapping.theoryID = theories.id "+
            "INNER JOIN logics ON logicMapping.logicID = logics.id WHERE theories.id IN("+theoryIDs+") ORDER BY theories.theoryYear ASC",
            function(err,rows,fields){
                res.send(rows);
        });
    }else{
        db.query("SELECT theories.theoryName, theories.theoryYear, theories.id as theoryID,"+
            "logics.logicsName, logics.id as logicID from logicMapping "+
            "INNER JOIN theories ON logicMapping.theoryID = theories.id "+
            "INNER JOIN logics ON logicMapping.logicID = logics.id ORDER BY theories.theoryYear ASC",
            function(err, rows, fields){
                res.send(rows);
        });
    }
});
// returns the keywords that belong to all the theories of a particular logic
app.post("/getkeywords",urlParser,function(req, res){
    db.query("SELECT keyword FROM keywords WHERE id IN (SELECT keywordId "+
        "from keywordMapping WHERE theoryId IN (SELECT theoryID FROM "+
        "logicMapping WHERE logicID = ?))",
        req.body.id,
        function(err, rows, fields){
            res.send(rows);
        });
});
// returns the keywords that belong to a selection of logics 
app.post("/getkeywordsoflogics", urlParser, function(req, res){
    var isEmpty = false;
    if(typeof req.body["ids[]"] !== 'undefined'){
        if(req.body["ids[]"].constructor === Array){
            var theoryIDs = "'"+req.body["ids[]"].join("','")+"'";
        }else{
            var theoryIDs = "'"+req.body["ids[]"]+"'";
        }
    }else{
        isEmpty = true;
    }
    if(!isEmpty){
        db.query("SELECT keyword, id FROM keywords WHERE id IN (SELECT keywordId "+
            "from keywordMapping WHERE theoryId IN ("+theoryIDs+"))", function(err, rows, fields){
                res.send(rows); 
            });
    }else{
        db.query("SELECT keyword, id from keywords", function(err, rows, fields){
            res.send(rows);
        });
    }
});
// return all info about a given theory
app.post("/gettheorydata", urlParser, function(req, res){
    db.query("SELECT id AS theoryID, theoryName, theorySummary, theoryPrinciples,"+
        "theoryExample, theoryStructureOfTheInternationalSystem, "+
        "theoryRelationOfSystemToEnvironment, theorySecurityReferentObject, "+
        "theoryAgent, theoryThreatActors, theorySourceOfResilience, "+
        "theoryInterventions, theoryStrategy, theoryPrimaryAuthors, "+
        "theoryYear, theoryLimitations, theoryAudience,theoryGroupIndex, theoryResearchDrawnUpon "+
        "FROM theories WHERE id = ?", req.body.id,
        function(err, rows, fields){
            res.send(rows[0]);
        });
});

app.post("/getlogicbyid", urlParser, function(req, res){
    db.query("SELECT * FROM logics where id = ?", req.body.id,
        function(err, rows, fields){
            res.send(rows[0]);
        });
});

app.post("/getlogicinfofromtheory", urlParser, function(req, res){
    db.query("SELECT logicsName, logicsPolitics, logicsTechnology, logicsOppositeLogic, logicsCloselyRelated FROM logics WHERE id IN (SELECT logicID FROM logicMapping where theoryID = ?)",
        req.body.id,
        function(err, rows, fields){
            res.send(rows);
        });
});

app.post("/editTheory",urlParser,function(req, res){
    if(req.body.id == null){
        res.redirect("/");
    }
    db.query("SELECT * FROM theories WHERE id = ?", req.body.id, function(err, rows, fields){
        if(Object.keys(rows).length === 0 || err){
            res.redirect("/");
        }else{
            db.query("SELECT keyword FROM keywords WHERE id IN (SELECT keywordId FROM "+
                "keywordMapping WHERE theoryId = ?)", req.body.id, function(err, theoryTags, fields){
                    if(err) throw err;
                    var theoryTagsComplete = theoryTags.map(s => s.keyword).join(",");
                    res.render("./private/theoryEditForm", {
                        theoryData : rows[0],
                        theoryTags : theoryTagsComplete                                                
                    });
            });
        }
    });
});

app.post("/processTheoryInsert", urlParser, function(req, res){
    db.query("INSERT INTO theories(theoryName, theorySummary, theoryPrinciples,"+
        "theoryExample,"+
    "theoryStructureOfTheInternationalSystem,theoryRelationOfSystemToEnvironment,"+
        "theorySecurityReferentObject,theoryAgent,theoryThreatActors,"+
    "theorySourceOfResilience,theoryInterventions,theoryStrategy,"+
        "theoryPrimaryAuthors,theoryYear,theoryLimitations,theoryAudience,"+
        "theoryResearchDrawnUpon"+
    ") VALUES" +
        "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            req.body.name, 
            req.body.summary,
            req.body.principles,
            req.body.example,
            req.body.structure,
            req.body.relationToEnvironment,
            req.body.referent,
            req.body.agent,
            req.body.threatActors,
            req.body.sourceOfResilience,
            req.body.interventions,
            req.body.strategy,
            req.body.authors,
            req.body.year,
            req.body.limitations,
            req.body.audience,
            req.body.researchDrawnUpon
        ], function(err,rows){
            if (err) throw err;
            console.log("inserted");
            var id = rows.insertId;
            // insert groups 
            insertGroups(req.body);
            // insert tags
            var tags = req.body.tags.split(",");
            var tagsToPush = [];
            var tagsLeftToInsert = tags.length;
            for(tag of tags){
                tag = tag.toLowerCase()
                    .replace(/[.,\/#!\$%\^&\*;\':{}=\_`~]/g, "")
                    .replace(/\s/g,"");
                tagsToPush.push(id + ", (SELECT id FROM keywords WHERE keyword = \'"+tag+"\')");
                db.query("INSERT IGNORE INTO keywords(keyword) VALUES (?)", tag,
                    function(err, rows){
                        if(err) throw err;
                        if(--tagsLeftToInsert == 0){
                            for(tagMap of tagsToPush){
                                var sql = "INSERT INTO keywordMapping(theoryId, keywordId)"+
                                    "VALUES ("+tagMap+")";
                                db.query(sql, function(err, rows){
                                    if(err) throw err;
                                });
                            }
                        }
                });
            }
    });
    res.redirect('/');
});
console.log("The server is running");
