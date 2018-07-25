var bodyParser = require('body-parser');
var express = require('express');
var db = require("./db");
var fs = require("fs");

var urlParser = bodyParser.urlencoded({extended: false});
var app = express();
var server = app.listen(25565);
app.set('view engine','ejs');
app.use(express.static('views/public'));

app.get("/theoryForm.html", function(req, res){
    db.query("SELECT groupName FROM groups", function(err, rows, fields){
        res.render("./private/theoryForm", {rows: rows});
    });
})

app.get("/", function(req, res){
    db.query("SELECT id, theoryName FROM theories", function(err, rows, fields){
        res.render("./public/index", {theories: rows}); 
    });
});

app.post("/editTheory",urlParser,function(req, res){
    db.query("SELECT * FROM theories WHERE id = ?", req.body.id, function(err, rows, fields){
        if(Object.keys(rows).length === 0 || err){
            res.redirect("/");
        }else{
            res.render("./private/theoryEditForm", {theoryData : rows[0]});
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
