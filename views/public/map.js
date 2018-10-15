//Globals
var gMain;
var width;
var height;
var scaleX;
var scaleColour;
var svg;
var g;
var gRelationships;
var theoryLine;
var refObLine;
var lastSelectedID; 
var lastSelectedLogicID;
var tooltip;
// for export
var addedTheoryDimensions = new Map();
var addedLogicDimensions = new Map();
// for the visualisation
var selectedLogics = [];
var selectedKeywords = new Map();
var selectedReferentObjects = new Map();
var selectedDimension = null;
var selectedTheories = new Map();
var selectedLogicsMap = new Map();

//var chart = venn.VennDiagram()
//    .width(250)
//    .height(250);                
var lineFunction = d3.line()
                       .x(function(d) { return d.x; })
                       .y(function(d) { return d.y; })
                       .curve(d3.curveMonotoneY);

window.addEventListener("resize", redraw);

// Adds the keywords to the search datalist on input
$("#keywordsSearchInput").on("input", addKeyword);

$("#projectDescription").on("input", function(){
    var text = $(this).val();
    $("#descContent").text(text);
});

$("#projectTitle").on("input", function(){
    var text = $(this).val();
    g.select("#mapTitle").text(text);
});

$("#projectDescription").on("input", function(){
    var text = $(this).val();
    d3.select("#mapDescription").text(text);
});
// Adds a given keyword to the user's current filter
$("#list").delegate(".listelement", "click", function(){
    var elemId = $(this).attr('data-id');
    d3.select("#"+elemId).transition()
       .ease(d3.easeCubic)
       .duration("100")
       .style("opacity", 0)
       .remove();
    selectedKeywords.delete(parseInt(elemId.split("kw")[1]));   
    $('p', '#theoryInfoMore').each(function() {
        var current = $(this);
        current.unmark(); 
    });
    findAndHighlightKeywords();
    getTheoriesFromKeywords();
});

// Removes a referent object from the user's selection
$("#referentObjList").delegate(".listelement", "click", function(){
    var elemId = $(this).attr('data-id');
    d3.select("#"+elemId) 
       .remove();
    var id = elemId.split("ro")[1];
    selectedReferentObjects.delete();   
    var circle = d3.select("#roc"+id);
    var text = d3.select("#rot"+id);
    
    text.attr("data-clicked", 0);
    circle.attr("data-clicked", 0);
    circle.transition()
        .ease(d3.easeCubic)
        .duration("250")
        .attr("fill", "#fff")
        .attr("stroke-width", "1");
    text.transition()
        .ease(d3.easeCubic)
        .duration("250")
        .attr("fill", "#5b5b5b")
        .style("font-weight", "normal");
    // Correclty removes the relationships that are relevant to this referent object
    gRelationships.selectAll("#ror"+id).transition()
        .each(function(){
            var current = d3.select(this);
            var theoryRelatedTo = g.select("#tc"+current.attr("data-theoryid"));
            var theoryRelatedToText = g.select("#tt"+current.attr("data-theoryid"));
            theoryRelatedTo.attr("data-clicked", 0).attr("data-selected", 0);
            theoryRelatedToText.attr("data-clicked", 0);
            theoryRelatedTo.transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", function(){
                    return document.getElementById("posNegSwitch").checked 
                        && (theoryRelatedTo.attr("data-clicked") == 1 || theoryRelatedTo.attr("data-selected") == 1)? 
                        theoryRelatedTo.attr("data-posneg") :  (theoryRelatedTo.attr("data-clicked") == 1 || theoryRelatedTo.attr("data-selected") == 1) ? d3.interpolateRainbow(theoryRelatedTo.datum().theoryGroupIndex/13): "#fff";
                })
                .attr("stroke-width", "1");
            theoryRelatedToText.transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#5b5b5b")
                .style("font-weight", "normal");
            gRelationships.selectAll("#r"+theoryRelatedTo.datum().theoryID).transition()
                .ease(d3.easeCubic)
                .duration("250")
                .style("opacity", 0)
                .remove();
            // unselects the theories that are not part of the new selection
            selectedTheories.delete(theoryRelatedTo.datum().theoryID);
                    
        })
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 0)
        .remove();
});
// Initialisation methods
colourGroupElements();
renderSVG();
getLogicIDs();
getTheories();
getReferentObjects();

// Clears all of the current selections
function clearSelections(){
    addedTheoryDimensions.clear(); 
    addedLogicDimensions.clear();
    selectedKeywords.clear();
    selectedReferentObjects.clear();
    selectedDimension = null;
    selectedTheories.clear();
    selectedLogicsMap.clear();
    selectedLogics = [];
   
    d3.selectAll(".elementContainer").remove();

    gRelationships.selectAll(".relationships")
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 0)
        .remove();
    d3.selectAll(".theoryInfoDiv")
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", function(){
            return d3.select(this).attr("id") == "groupsDiv" ? 1 : 0;
        })
        .on("end", function(){
            d3.select(this).attr("id") == "groupsDiv" ? d3.select(this).style("display", "block") : d3.select(this).style("display", "none");
        });
    g.selectAll(".logicCircle")
        .attr("data-clicked",0)
        .transition()
            .ease(d3.easeCubic)
            .duration("200")
            .attr("r", 15)
            .attr("stroke-width", 0);
    g.selectAll(".logicCircleName")
        .attr("data-clicked", 0)
        .transition()
            .ease(d3.easeCubic)
            .duration("200")
            .attr("fill","#5b5b5b"); 
    g.selectAll(".theoryCircle")
        .attr("data-selected", 0)
        .attr("data-clicked", 0)
        .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#fff")
            .attr("stroke-width", "1");
    g.selectAll(".theoryTitle")
        .attr("data-selected",0)
        .attr("data-clicked", 0)
        .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b")
            .style("font-weight", "normal");
    g.selectAll(".referentObjectCircle")
        .attr("data-clicked", 0)
        .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#fff")
            .attr("stroke-width", "1");
    g.selectAll(".referentObjectTitle")
        .attr("data-clicked", 0)
        .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b")
            .style("font-weight", "normal");
   $(".selectionList").empty();
   //updateVennDiagram();
   $("#relatedKeywords").children().remove();  
   $("#keywordsSearchInput").val("");
   $("#keywordsSwitch").prop("checked", false);
   $("#posNegSwitch").prop("checked", false);
}

// redraws with a specific width/height
function redrawWithParams(w, h){
    width = w;
    height = h;
   
    // redraw theoryLines at correct width and height
    svg
        .attr("width", width)
        .attr("height", height)
    svg.select("#backgroundrect")
        .attr("width", width)
        .attr("height", height)
    theoryLine
        .attr("y", (height/2)+40)
        .attr("width", width)
    refObLine
        .attr("y", ((height/5)*4)+40)
        .attr("width", width)
    var infoButton = g.select("#info")
        .attr("x", width - 50)
        .attr("y", 20)
    g.select("#infoImg")
        .attr("x", infoButton.attr("x"))
        .attr("id", "infoImg")
        .attr("y", infoButton.attr("y"))
    d3.select("#fullscreen")
        .attr("x", 20)
        .attr("y", 20)
    d3.select("#fullscreenRect")
        .attr("x", 20)
        .attr("y", 20)
    g.select("#mapTitle")
        .attr("x", width/2)
        .attr("y", 40);

    
    redrawLogicCircle();

    var theoryCircles = g.selectAll(".theoryCircle");
    var increment =(width-40)/theoryCircles.size();
    theoryCircles
         .attr("cx", function(d, i){
             return (i * increment)+22;
         })
         .attr("cy", parseInt(theoryLine.attr("y"))+2);

    g.selectAll(".theoryTitle")
         .attr("x", function(d,i){
             return (i * increment)+22;
         })
         .attr("y", parseInt(theoryLine.attr("y"))-9)
         .attr("transform", function(d,i) { 
             return "rotate(-45,"+((i*increment)+22)+","+(parseInt(theoryLine.attr("y"))-9)+")"
         });
    redrawReferentObjects();
    redrawRelationships();
}

// redraws based on the size of the div
function redraw(){
    width = document.getElementById('mapContainer').offsetWidth;
    height = document.getElementById('mapContainer').offsetHeight;
   
    // redraw theoryLines at correct width and height
    svg
        .attr("width", width)
        .attr("height", height)
    svg.select("#backgroundrect")
        .attr("width", width)
        .attr("height", height)
    theoryLine
        .attr("y", height/2 + 40)
        .attr("width", width)
    refObLine
        .attr("y", ((height/5)*4)+40)
        .attr("width", width)

    var infobutton = g.select("#info")
        .attr("x", width - 50)
        .attr("y", 20)
    g.select("#infoImg")
        .attr("x", infobutton.attr("x"))
        .attr("id", "infoImg")
        .attr("y", infobutton.attr("y"))
    g.select("#mapTitle")
        .attr("x", width/2)
        .attr("y", 40);

    redrawLogicCircle();

    var theoryCircles = g.selectAll(".theoryCircle");
    var increment =(width-40)/theoryCircles.size();
    theoryCircles
         .attr("cx", function(d, i){
             return (i * increment)+22;
         })
         .attr("cy", parseInt(theoryLine.attr("y"))+2);

    g.selectAll(".theoryTitle")
         .attr("x", function(d,i){
             return (i * increment)+22;
         })
         .attr("y", parseInt(theoryLine.attr("y"))-9)
         .attr("transform", function(d,i) { 
             return "rotate(-45,"+((i*increment)+22)+","+(parseInt(theoryLine.attr("y"))-9)+")"
         });
    redrawReferentObjects();
    redrawRelationships();
    
    g.select("#venn").select("svg")
        .attr("x", width - 300)
        .attr("y", 30)
}

// Redraws relationship lines based on the new width/height
function redrawRelationships(){
    var relationships = gRelationships.selectAll(".relationships")
        relationships.each(function(d){
            var relationship = d3.select(this); 
            if(relationship.attr("id").startsWith("ror")){
                var theoryRelatedTo = g.select("#tc"+relationship.attr("data-theoryid"));
                relationship
                    .attr("d", function(d){ return lineFunction([{"x": theoryRelatedTo.attr("cx"), "y" : theoryRelatedTo.attr("cy")},
                            {"x" : theoryRelatedTo.attr("cx"), "y" : (height/3)*2},
                            {"x" : g.select("#roc"+d.theorySecurityReferentObject).attr("cx") , "y" : refObLine.attr("y")-10},
                            {"x" : g.select("#roc"+d.theorySecurityReferentObject).attr("cx") , "y" : refObLine.attr("y")}])
                    })
            }else{
                var logicCircle = g.select("#c"+d.logicID);
                relationship
                    .attr("d", function(d){
                        var logicCircle = g.select("#c"+d.logicID);
                        return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                            {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                            {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : theoryLine.attr("y")-10},
                            {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : theoryLine.attr("y")}])
                    });
            }
        });
}

// redraws referent objects based on new width/height
function redrawReferentObjects(){
    var refObCircles = g.selectAll(".referentObjectCircle");
    var increment =(width-30)/refObCircles.size();
    refObCircles
         .attr("cx", function(d, i){
             return (i * increment)+30;
         })
         .attr("cy", function(){ return (parseInt(refObLine.attr("y"))+2)})

    g.selectAll(".referentObjectTitle")
         .attr("x", function(d,i){
             return (i * increment)+30;
         })
         .attr("y", parseInt(refObLine.attr("y"))-7)
         .attr("transform", function(d,i) { 
             return "rotate(-45,"+((i*increment)+30)+","+(parseInt(refObLine.attr("y"))-5)+")"
         })
}

// redraws the logic circle based on new width/height
function redrawLogicCircle(){
    var logicCircles = g.selectAll(".logicCircle");
    
    var radius = (height/5)*0.4;

    var incrementAngle = 360/logicCircles.size();
    logicCircles
        .attr("cx", function(d, i){
            return (radius * Math.cos(Math.radians(i * incrementAngle-18)))+width/2;
        })
        .attr("cy", function(d, i){
            return (radius * Math.sin(Math.radians(i * incrementAngle-18)))+height/6;
        })
    
    var fontSize = 16;

    g.selectAll(".logicCircleName")
        .attr("x", function(d, i){
            var degrees = (i * incrementAngle-18);
            return degrees >= 90 && degrees <= 260 ? ((radius * Math.cos(Math.radians(degrees)))+width/2)-23 : ((radius * Math.cos(Math.radians(degrees)))+width/2)+23;
        })
        .attr("y",  function(d, i){
            var degrees = (i * incrementAngle-18);
            return degrees >= 265 && degrees <= 300 ? (radius * Math.sin(Math.radians(degrees)))+(height/6)-4: (radius * Math.sin(Math.radians(degrees)))+height/6+4;
        })
        .attr("text-anchor", function(d, i){
            var degrees = i * incrementAngle;
            return degrees >= 90 && degrees <= 270 ? "end" : "start"; 
        })

        g.select("#logicLabel")
            .attr("x", width/2)
            .attr("y", height/6);
        g.select("#theoryLabel")
            .attr("x", width/2)
            .attr("y", parseInt(theoryLine.attr("y"))+40)
        g.select("#refObLabel")
            .attr("x", width/2)
            .attr("y", parseInt(refObLine.attr("y"))+40)
        g.select("#scrollDownLabel")
            .attr("x", width/2)
            .attr("y", parseInt(refObLine.attr("y"))+90);
}

// Colours the group key elements
function colourGroupElements(){
    $("#groupsDiv").css("opacity",1).children().each(function(){
        if($(this).attr("id") == "titleGroup"){
            $(this).css("background-color","#777");
        }else{$(this).css("background-color", 
            d3.interpolateRainbow(($(this).attr("data-id"))/13));
        }
    });
}
// gets the theories for initialisation
function getTheories(){
   $.get("gettheories", function(data, status){
       // adds the circles
       var increment =(width-40)/data.length;
       g.selectAll(".theoryCircle")
            .data(data, function(d){ d.theoryID})
            .enter()
            .append("circle")
            .attr("id", function(d){ return "tc"+d.theoryID})
            .attr("class", "theoryCircle")
            .attr("cx", function(d, i){
                return (i * increment)+22;
            })
            .attr("cy", parseInt(theoryLine.attr("y"))+2)
            .attr("r", 8)
            .attr("fill", "#fff")
            .attr("stroke", "#000000")
            .attr("data-selected", 0)
            .on("mouseover", handleTheoryMouseOver)
            .on("mouseout", handleTheoryMouseOut)
            .on("click", handleTheoryClick)
            .append("svg:title")
            .text(function(d) { return d.theoryName +"\n" + d.theorySummary; });
       // adds the titles
       g.selectAll(".theoryTitle")
            .data(data, function(d) { d.theoryID})
            .enter()
            .append("text")
            .attr("class", "theoryTitle")
            .attr("data-clicked", 0)
            .attr("id", function(d){ return "tt"+d.theoryID})
            .attr("x", function(d,i){
                return (i * increment)+22;
            })
            .attr("y", parseInt(theoryLine.attr("y"))-9)
            .attr("transform", function(d,i) { 
                return "rotate(-45,"+((i*increment)+22)+","+(parseInt(theoryLine.attr("y"))-9)+")"
            })
            .text(function(d){ return d.theoryName})
            .style("font-size", "1px")
            .style("font-family", "'Roboto', sans-serif")
            .attr("fill", "#5b5b5b")
            .on("mouseover", handleTheoryMouseOver)
            .on("mouseout", handleTheoryMouseOut)
            .on("click", handleTheoryClick)
            .transition()
                .ease(d3.easeCubic)
                .duration("1200")
                .style("font-size","12px");
        // gets the pos/neg value of all the theories
        $.get("getPosNegAll",
            function(data, status){
                for(datum of data){
                    g.select("#tc"+datum.theoryID)
                        .attr("data-posneg",function(){
                            return datum.logicsPositiveSecurity == 1 ? "#cc99cc" : "#99cccc";
                        });
                }
            });
   });
}
// Allows you to add a dimension for filtering by.
function addSelectedDimension(){
    var e = document.getElementById("dimensionsSelection");
    if(e.options[e.selectedIndex].value == "none"){
        selectedDimension = null;
    }
    else if(selectedDimension != (e.options[e.selectedIndex].value)){
        var id = e.options[e.selectedIndex].value;
        selectedDimension = e.options[e.selectedIndex].value;
    }
    if(d3.select("#theoryInfoMore").style("display") != "none"){
        $.post("gettheorydata", {id : lastSelectedID},
            function(data, status){
                if(selectedDimension == null){
                    showTheoryData(data, true);   
                }
                else{
                    showTheoryData(data, false); 
                }
            });
    }
}

// adds the selected referent object to the user's selection
function addSelectedRefOb(){
    var e = document.getElementById("referentObjectsSelection");
    if(!selectedReferentObjects.has(parseInt(e.options[e.selectedIndex].value))){
        var id = e.options[e.selectedIndex].value;
        var val = e.options[e.selectedIndex].text;
        $('#referentObjList').append('<li id="'+"ro"+id+'" class="listIn"><input type="button" data-id="'+"ro"+id+'" class="listelement" value="X" /> '+val+'<input type="hidden" name="listed[]" value="'+val+'"></li>');
        selectedReferentObjects.set(parseInt(e.options[e.selectedIndex].value), e.options[e.selectedIndex].text);
         
        var circle = d3.select("#roc"+id);
        var text = d3.select("#rot"+id);
        text.attr("data-clicked", 1);
        circle.attr("data-clicked", 1);
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121")
            .style("font-weight", "bold");
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill","#f2f2f2")
            .attr("stroke-width", "3"); 
        $.post("getRelationshipToTheories",
            {id : id},
            function(data, status){
                showRelationshipToTheory(data, id); 
            });
        //updateVennDiagram();
    }

    document.getElementById("referentObjectsSelection").selectedIndex = -1;
}

// gets the referent objects from the database and appends them to their respective line
function getReferentObjects(){
    $.get("getreferentobjects", function(data, status){
        var increment =(width-30)/data.length;
        g.selectAll(".referentObjectCircle")
             .data(data, function(d){ d.id})
             .enter()
             .append("circle")
             .attr("id", function(d){ return "roc"+d.id})
             .attr("class", "referentObjectCircle")
             .attr("cx", function(d, i){
                 return (i * increment)+30;
             })
             .attr("cy", function(){ return (parseInt(refObLine.attr("y"))+2)})
             .attr("r", 7)
             .attr("fill", "#ffffff")
             .attr("stroke","#000000")
             .attr("data-selected", 0)
             .on("mouseover", handleReferentObjectMouseOver)
             .on("mouseout", handleReferentObjectMouseOut)
             .on("click", handleReferentObjectClick)
             .append("svg:title")
             .text(function(d) { return d.referentObject; });

        g.selectAll(".referentObjectTitle")
             .data(data, function(d) { d.id})
             .enter()
             .append("text")
             .attr("class", "referentObjectTitle")
             .attr("data-clicked", 0)
             .attr("id", function(d){ return "rot"+d.id})
             .attr("x", function(d,i){
                 return (i * increment)+30;
             })
             .attr("y", parseInt(refObLine.attr("y"))-7)
             .attr("transform", function(d,i) { 
                 return "rotate(-45,"+((i*increment)+30)+","+(parseInt(refObLine.attr("y"))-5)+")"
             })
             .text(function(d){ return d.referentObject.length > 40 ? d.referentObject.substring(0,40)+"..." : d.referentObject})
             .style("font-size", "1px")
             .style("font-family", "'Roboto', sans-serif")
             .attr("fill", "#5b5b5b")
             .on("mouseover", handleReferentObjectMouseOver)
             .on("mouseout", handleReferentObjectMouseOut)
             .on("click", handleReferentObjectClick)
             .transition()
                 .ease(d3.easeCubic)
                 .duration("1200")
                 .style("font-size","12px");
        for(datum of data){
            $('#referentObjectsSelection').append($('<option>', {
                value: datum.id,
                text: datum.referentObject
            }));
        }
    });
}

function handleReferentObjectMouseOver(d, i){
    if(d3.select("#rot"+d.id).attr("data-clicked") == 0){
            d3.select("#rot"+d.id).transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#212121");
            d3.select("#roc"+d.id)
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("stroke-width", 3)
    }
}

function handleReferentObjectMouseOut(d, i){
    if(d3.select("#rot"+d.id).attr("data-clicked") != 1){
        d3.select("#rot"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b");
        d3.select("#roc"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                 return (g.select("#roc"+d.id).attr("data-selected") == 0 ? "#ffffff" : d3.interpolateRainbow(d.id/21));
            })
            .attr("stroke-width", 1);
    }
}
// Handles the action upon click of a referent object
function handleReferentObjectClick(d, i){
    var circle = d3.select("#roc"+d.id);
    var text = d3.select("#rot"+d.id);
    // if the referent object hasn't been clicked
    if(circle.attr("data-clicked") == 0 || text.attr("data-clicked") == 0){
        // if a referent object was previously clicked -> allows us to set the right colours
        if(lastSelectedID != null){
           d3.select("#roc"+lastSelectedID)
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#fff");
        }    
        text.attr("data-clicked", 1);
        circle.attr("data-clicked", 1);
        lastSelectedID = d.id;  
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121")
            .style("font-weight", "bold");
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill","#f2f2f2")
            .attr("stroke-width", "3"); 
        // show the relationship to theories
        $.post("getRelationshipToTheories",
            {id : d.id},
            function(data, status){
                showRelationshipToTheory(data, d.id); 
            });
        // Add to list 
        //$('#referentObjList').append('<li id="'+"ro"+d.id+'" class="listIn"><input type="button" data-id="'+"ro"+d.id+'" class="listelement" value="X" /> '+d.referentObject+'<input type="hidden" name="listed[]" value="'+d.referentObject+'"></li>');
        selectedReferentObjects.set(d.id, d.referentObject);
        //updateVennDiagram(); 
    }else{
        // if a referent object has already been clicked, handles deselection
        text.attr("data-clicked", 0);
        circle.attr("data-clicked", 0);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#ffffff")
            .attr("stroke-width", "1");
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b")
            .style("font-weight", "normal");
        // finds all relationships to the given referent object and removes them
        gRelationships.selectAll("#ror"+d.id).each(function(){
                var current = d3.select(this);
                var theoryRelatedTo = g.select("#tc"+current.attr("data-theoryid"));
                var theoryRelatedToText = g.select("#tt"+current.attr("data-theoryid"));
                theoryRelatedTo.attr("data-clicked", 0);
                theoryRelatedToText.attr("data-clicked", 0);
                theoryRelatedTo.transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .attr("fill", function(){
                        return document.getElementById("posNegSwitch").checked 
                            && (theoryRelatedTo.attr("data-clicked") == 1 || theoryRelatedTo.attr("data-selected") == 1)? 
                            theoryRelatedTo.attr("data-posneg") :  (theoryRelatedTo.attr("data-clicked") == 1 || theoryRelatedTo.attr("data-selected") == 1) ? d3.interpolateRainbow(theoryRelatedTo.datum().theoryGroupIndex/13): "#fff";
                    })
                    .attr("stroke-width", "1");
                theoryRelatedToText.transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .attr("fill", "#5b5b5b")
                    .style("font-weight", "normal");
                gRelationships.selectAll("#r"+theoryRelatedTo.datum().theoryID).transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .style("opacity", 0)
                    .remove();
                selectedTheories.delete(theoryRelatedTo.datum().theoryID);
                        
            })
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity",0)
            .remove();
        selectedReferentObjects.delete(d.id);
        d3.select("#ro"+d.id)
            .remove();
        //updateVennDiagram();
    }
}

// Draws the relationship to the theory from the referent object
function showRelationshipToTheory(data, id){
    if(data.length == 0){
        return;
    }
    for(datum of data){
        theoryRelatedTo = g.select("#tc"+datum.theoryID);
        theoryRelatedToText = g.select("#tt"+datum.theoryID);
        gRelationships.append("path")
            .datum(datum, datum.theoryID)
            .attr("d", function(d){ return lineFunction([{"x": theoryRelatedTo.attr("cx"), "y" : theoryRelatedTo.attr("cy")},
                {"x" : theoryRelatedTo.attr("cx"), "y" : (height/3)*2},
                {"x" : g.select("#roc"+id).attr("cx") , "y" : refObLine.attr("y")-10},
                {"x" : g.select("#roc"+id).attr("cx") , "y" : refObLine.attr("y")}])
        })
        .attr("stroke", function(d){
            return document.getElementById("posNegSwitch").checked == true ? 
                d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
        })
        .attr("stroke-width", 10)
        .attr("stroke-dasharray", "2")
        .attr("class", "relationships")
        .attr("id", function(d) { return "ror"+id})
        .attr("data-theoryid", datum.theoryID)
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .style("opacity", 0)
        .transition().ease(d3.easeCubic).duration("250").style("opacity",1);
        
        theoryRelatedTo.attr("data-clicked", 1);
        theoryRelatedToText.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121")
            .style("font-weight", "bold");
        theoryRelatedTo.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(d){
                return document.getElementById("posNegSwitch").checked ? 
                    theoryRelatedTo.attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
            })
            .attr("stroke-width", "3"); 
        selectedTheories.set(datum.theoryID, theoryRelatedTo.datum().theoryName);
        $.post("getRelationship", {id : datum.theoryID}, function(dataLog, status){
            for(datumLog of dataLog){
                gRelationships.append("path").datum(datumLog, datumLog.theoryID)
                    .attr("d", function(d){
                        var logicCircle = g.select("#c"+d.logicID);
                        return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                        {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                        {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : theoryLine.attr("y")-10},
                        {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : theoryLine.attr("y")}])
                    })
                    .attr("stroke", function(d){
                        return document.getElementById("posNegSwitch").checked == true ? 
                            d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
                    })
                    .attr("stroke-width", 10) 
                    .attr("stroke-dasharray", "2")
                    .attr("class", "relationships")
                    .attr("id", function(d) { return "r"+d.theoryID})
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .style("opacity", 0)
                    .transition()
                        .ease(d3.easeCubic)
                        .duration("250")
                        .style("opacity",1);
            }
        });
    }
}

// Adds a keyword to the user's datalist of keywords
function addKeyword(){
    var val = $(this).val();
    if($('#relatedKeywords').find('option').filter(function(){
        return this.value.toUpperCase() === val.toUpperCase();        
    }).length) {
       var id = $("#relatedKeywords [value='"+val+"']").data("id"); 
       if(!selectedKeywords.has(id)){
           selectedKeywords.set(id, val);
           $('#list').append('<li id="'+"kw"+id+'" class="listIn"><input type="button" data-id="'+"kw"+id+'" class="listelement" value="X" /> '+val+'<input type="hidden" name="listed[]" value="'+val+'"></li>');
           getTheoriesFromKeywords(); 
           findAndHighlightKeywords();
       }
    }
}

// gets the theories related to the given keyword selection and highlights them
function getTheoriesFromKeywords(){
    $.post("gettheoriesbykeywords", 
    { keywords : Array.from(selectedKeywords.keys()) , logicIds : selectedLogics},
    updateMap);
}


// colours all elements relative to whether they are positive or negative (dependent on their logic)
function getPosNeg(){
    var ids = Array.from(selectedTheories.keys());
    if(document.getElementById("posNegSwitch").checked){
        var wasEmpty = false;
        if(selectedLogics.length == 0){
            wasEmpty = true;
            addAllLogics();
        }
        $.post("getPosNeg", { ids : ids, logicIds : selectedLogics },
                function(data, status){
                    for(datum of data){
                        g.select("#tc"+datum.theoryID)
                            .attr("data-posneg",function(){
                                return datum.logicsPositiveSecurity == 1 ? "#cc99cc" : "#99cccc";
                            }).transition()
                            .ease(d3.easeCubic)
                            .duration("250").attr("fill",function(){
                                return datum.logicsPositiveSecurity == 1 ? "#cc99cc" : "#99cccc";
                            })
                        gRelationships.selectAll("#r"+datum.theoryID)
                            .transition().ease(d3.easeCubic).duration("250")
                            .attr("stroke", function(){
                                return datum.logicsPositiveSecurity == 1 ? "#cc99cc" : "#99cccc";
                            });
                        gRelationships.selectAll(".relationships")
                            .each(function(d){
                                var possible = d3.select(this);
                                if(possible.attr("id").startsWith("ror")){
                                    if(possible.attr("data-theoryid") == datum.theoryID){
                                        possible.transition().ease(d3.easeCubic).duration("250")
                                        .attr("stroke", function(){
                                            return datum.logicsPositiveSecurity == 1 ? "#cc99cc" : "#99cccc";
                                        });
                                    }
                                }
                            });
                    }
                });
        if(wasEmpty){
            selectedLogics = [];
        }
    }else{
        for(circle of ids){
            g.select("#tc"+circle)
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", function(d){
                    return d3.interpolateRainbow(d.theoryGroupIndex/13);
                });
            gRelationships.selectAll("#r"+circle)
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("stroke", function(d){
                    return d3.interpolateRainbow(d.theoryGroupIndex/13)
                })

            gRelationships.selectAll(".relationships")
                .each(function(d){
                    var possible = d3.select(this);
                    if(possible.attr("id").startsWith("ror")){
                        if(possible.attr("data-theoryid") == circle ){
                            possible.transition().ease(d3.easeCubic).duration("250")
                            .attr("stroke", d3.interpolateRainbow(g.select("#tc"+circle).datum().theoryGroupIndex/13));
                        }
                    }
                });
            }
    }
    
}

// Adds all logics to the current selection
function addAllLogics(){
    for(datum of g.selectAll(".logicCircle").data()){
        selectedLogics.push(datum.id);
    }
}

// Allows the user to toggle relationship visibility.
function showHideRelationships(){
    if(!document.getElementById("relationshipsSwitch").checked){
        gRelationships.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0)
    }else{
        gRelationships.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 1)
    }
}

// gets all the relationships and displays them based on the user's current selection 
function getRelationships(){
    if(g.selectAll(".theoryCircle").data().length == 0){
        return;
    }
    var ids = [];
    for(datum of g.selectAll(".theoryCircle").data()){
        if(g.select("#tc"+datum.theoryID).attr("data-selected") == 1){
            ids.push(datum.theoryID);
        }
    }
    if(document.getElementById("relationshipsSwitch").checked == true){
        $.post("getRelationships", { ids : ids, logicIds : selectedLogics},
            function(data, status){
                if(data.length == 0) { 
                    gRelationships.selectAll(".relationships")
                        .transition()
                        .ease(d3.easeCubic)
                        .duration("250")
                        .style("opacity",0)
                        .remove();       
                    return
                } 
                var relationships = gRelationships.selectAll(".relationships")
                    .data(data)
                relationships.enter().append("path")
                    .merge(relationships)
                    .attr("d", function(d){
                        var logicCircle = g.select("#c"+d.logicID);
                        return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                            {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                            {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : theoryLine.attr("y")-10},
                            {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : theoryLine.attr("y")}])
                    })
                    .attr("stroke", function(d){
                        return document.getElementById("posNegSwitch").checked == true ? 
                            d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
                    })
                    .attr("class", "relationships")
                    .attr("id", function(d) { return "r"+d.theoryID})
                    .attr("stroke-width", 2)
                    .attr("fill", "none")
                    .style("opacity", 0)
                    .transition().ease(d3.easeCubic).duration("250").style("opacity",1);
                relationships.exit().remove();
            });
    }else{
        gRelationships.selectAll(".relationships")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity",0)
            .remove();        
    }
    
}

// adds the keywords based on your search to the datalist 
function getKeywords(){
    var word = document.getElementById("keywordsSearchInput").value;
    $.post("getkeywordsbyinput", { keyword : word }, 
        function(data, status){
            document.getElementById('relatedKeywords').innerHTML = '';
            for(datum of data){
                $('#relatedKeywords').append("<option data-id='"+ datum.id +"' value='"+datum.keyword+"'>");
            }
        });
}

// renders all the logic circles
function getLogicIDs(){
    $.get("getlogicidsandnames", function(data){
        renderLogicCircle(data); 
    });
}

// cont
function renderLogicCircle(data){
    var radius = (height/5)*0.4;

    var incrementAngle = 360/data.length;

    g.selectAll("logicCircle")
        .data(data)
        .enter()
        .append("circle")
        .attr("data-clicked", 0)
        .attr("class", "logicCircle")
        .attr("id", function(d){ return "c"+d.id;})
        .attr("cx", function(d, i){
            return (radius * Math.cos(Math.radians(i * incrementAngle-18)))+width/2;
        })
        .attr("cy", function(d, i){
            return (radius * Math.sin(Math.radians(i * incrementAngle-18)))+height/6;
        })
        .attr("r", 1)
        .attr("fill","#ccc")
        .attr("stroke", "#000")
        .attr("stroke-width", 0)
        .on("mouseover", mouseOverLogicCircle)
        .on("mouseout", mouseOutLogicCircle)
        .on("click", selectLogicAndShow)
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .attr("r", 15)
    
    g.selectAll(".logicCircle")
        .append("svg:title")
        .append("svg:title")
        .text(function(d){
            return d.logicsSummary;   
        })
        

    var fontSize = 13;

    g.selectAll("logicText")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "logicCircleName")
        .attr("id", function(d){return "t"+d.id;})
        .attr("data-clicked", 0)
        .attr("x", function(d, i){
            var degrees = (i * incrementAngle-18);
            return degrees >= 90 && degrees <= 260 ? ((radius * Math.cos(Math.radians(degrees)))+width/2)-23: ((radius * Math.cos(Math.radians(degrees)))+width/2)+30;
        })
        .attr("y",  function(d, i){
            var degrees = (i * incrementAngle-18);
            return degrees >= 265 && degrees <= 300 ? (radius * Math.sin(Math.radians(degrees)))+(height/6)-4: (radius * Math.sin(Math.radians(degrees)))+height/6+4;
        })
        .attr("text-anchor", function(d, i){
            var degrees = i * incrementAngle;
            return degrees >= 90 && degrees <= 270 ? "end" : "start"; 
        })
        .attr("fill", "#5b5b5b")
        .text(function(d){
            return d.logicsName;
        }).style("font-size", fontSize+"px")
        .style("font-family", "'Roboto', sans-serif")
        .on("mouseover", mouseOverLogicName)
        .on("mouseout", mouseOutLogicName)
        .on("click", selectLogicAndShow);

    g.append("text")
        .attr("id", "logicLabel")
        .attr("x", width/2)
        .attr("y", height/6)
        .attr("text-anchor", "middle")
        .text("Logics")
        .style("font-family", "'Roboto', sans-serif")
        .attr("fill", "#3d3d3d")
        .style("font-size", "13px");
}

// updates the map based on the given filtering from and highlights the selected elements
function updateMap(data, status){
    if(data.length == 0){
        g.selectAll(".theoryCircle")
            .attr("data-selected", 0)
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(d){
                if(selectedTheories.has(d.theoryID)){
                    return d3.interpolateRainbow(d.theoryGroupIndex/13)
                }
                return "#fff"
            });    
        g.selectAll(".theoryTitles").transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b")
        //if(document.getElementById("relationshipsSwitch").checked){
        //    getRelationships();
        //}
        return;
    }                                    
    var theoryLineCircle = g.selectAll(".theoryCircle")
        .data(data, function(d) { return d.theoryID });
    theoryLineCircle.enter()
        .merge(theoryLineCircle)
        .attr("data-selected", 1)
    if(!document.getElementById("posNegSwitch").checked){
        theoryLineCircle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(d){
                return d3.interpolateRainbow(d.theoryGroupIndex/13)
            });
    }else{
        theoryLineCircle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(d){
                return d3.select("#tc"+d.theoryID).attr("data-posneg");
            });
    }
    theoryLineCircle.exit()
        .attr("data-selected", 0)
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .attr("fill", function(d){
            if(selectedTheories.has(d.theoryID)){
                return d3.interpolateRainbow(d.theoryGroupIndex/13)
            }
            return "#fff"
        });
}

function handleTheoryMouseOver(d,i){ 
    if(d3.select("#tt"+d.theoryID).attr("data-clicked") == 0){
            d3.select("#tt"+d.theoryID).transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#212121");
            d3.select("#tc"+d.theoryID)
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("stroke-width", 3);
    }
}

function handleTheoryMouseOut(d,i){
    if(d3.select("#tc"+d.theoryID).attr("data-clicked") != 1 && !selectedTheories.has(d.theoryID)){
        d3.select("#tt"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b");
            d3.select("#tc"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                 return document.getElementById("posNegSwitch").checked == true 
                    && d3.select("#tc"+d.theoryID).attr("data-posneg") != null && d3.select("#tc"+d.theoryID).attr("data-selected") == 1 ? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") : (g.select("#tc"+d.theoryID).attr("data-selected") == 0 ? "#fff" : d3.interpolateRainbow(d.theoryGroupIndex/13));
            })
            .attr("stroke-width", 1);
    }
}
// Handles behaviour for clicking on a theory
function handleTheoryClick(d,i){
    var circle = d3.select("#tc"+d.theoryID);
    var text = d3.select("#tt"+d.theoryID);
    //if the theory hasn't been clicked
    if(circle.attr("data-clicked") == 0 || text.attr("data-clicked") == 0){
        // allows us to set the right colour for the previous selected theory
        if(lastSelectedID != null){
           d3.select("#tc"+lastSelectedID).transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", function(){
                    return document.getElementById("posNegSwitch").checked &&
                        (d3.select("#tc"+lastSelectedID).attr("data-clicked") == 1 || d3.select("#tc"+lastSelectedID).attr("data-selected") == 1) ? 
                        d3.select("#tc"+lastSelectedID).attr("data-posneg") : d3.select("#tc"+lastSelectedID).attr("data-clicked") == 1 || d3.select("#tc"+lastSelectedID).attr("data-selected") == 1 ? d3.interpolateRainbow(d3.select("#tc"+lastSelectedID).datum().theoryGroupIndex/13) : "#fff";
                }).on("end", function(){
                    d3.select(this).attr("data-clicked", 0);
                });
           d3.select("#tt"+lastSelectedID).attr("data-clicked",0);
        }    
        text.attr("data-clicked", 1);
        circle.attr("data-clicked", 1);
        lastSelectedID = d.theoryID;  
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#212121")
            .style("font-weight", "bold");
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill","#f2f2f2")
            .attr("stroke-width", "3"); 
        selectedTheories.set(d.theoryID, d.theoryName);
        // if we haven't already selected the referent object for this theory:
        if(!selectedReferentObjects.has(d.theorySecurityReferentObject)){
            selectedReferentObjects.set(d.theorySecurityReferentObject, d3.select("#roc"+d.theorySecurityReferentObject).datum().referentObject)
            $('#referentObjList').append('<li id="'+"ro"+d.theorySecurityReferentObject+'" class="listIn"><input type="button" data-id="'+"ro"+d.theorySecurityReferentObject+'" class="listelement" value="X" /> '+(d3.select("#roc"+d.theorySecurityReferentObject).datum().referentObject)+'<input type="hidden" name="listed[]" value="'+(d3.select("#roc"+d.theorySecurityReferentObject).datum().referentObject)+'"></li>');
             
            var circleRef = d3.select("#roc"+d.theorySecurityReferentObject);
            var textRef = d3.select("#rot"+d.theorySecurityReferentObject);
            textRef.attr("data-clicked", 1);
            circleRef.attr("data-clicked", 1);
            textRef.transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#212121")
                .style("font-weight", "bold");
            circleRef.transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill","#f2f2f2")
                .attr("stroke-width", "3"); 
        }
        // shows the relevant data about the theory in aside-2
        $.post("gettheorydata", {id : d.theoryID},
            function(data, status){
                if(selectedDimension == null){
                    showTheoryData(data, true);   
                }
                else{
                    showTheoryData(data, false); 
                }
                handleAddRemoveTheoryDimensions(d.theoryID);
                document.getElementById("theoryInfoMore").scrollTop = 0;
            });
        // gets the relationship for this theory (to logic and to referent object)
        if(gRelationships.selectAll("#ror"+d.theorySecurityReferentObject+"[data-theoryid='"+d.theoryID+"']").size() == 0){
            $.post("getRelationship",
                {id : d.theoryID},
                function(data, status){
                    showRelationship(data, d.theoryID); 
                });
        } 
    }else{
        // if the theory has already been clicked
        if(gRelationships.selectAll("#ror"+d.theorySecurityReferentObject).size() <= 1 ){
            d3.select("#ro"+d.theoryReferentObject).remove();
            selectedReferentObjects.delete(d.theorySecurityReferentObject);   
            var circleRef = d3.select("#roc"+d.theorySecurityReferentObject);
            var textRef = d3.select("#rot"+d.theorySecurityReferentObject);
    
            textRef.attr("data-clicked", 0);
            circleRef.attr("data-clicked", 0);
            circleRef.transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#fff")
                .attr("stroke-width", "1");
            textRef.transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#5b5b5b")
                .style("font-weight", "normal");
        }
        text.attr("data-clicked", 0);
        circle.attr("data-clicked", 0);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", function(){
                return document.getElementById("posNegSwitch").checked 
                    && (d3.select("#tc"+d.theoryID).attr("data-clicked") == 1 || d3.select("#tc"+d.theoryID).attr("data-selected") == 1)? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") :  (d3.select("#tc"+d.theoryID).attr("data-clicked") == 1 || d3.select("#tc"+d.theoryID).attr("data-selected") == 1) ? d3.interpolateRainbow(d.theoryGroupIndex/13): "#fff";
            })
            .attr("stroke-width", "1");
        text.transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5b5b5b")
            .style("font-weight", "normal");
        gRelationships.selectAll("#r"+d.theoryID).transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0)
            .remove();
        selectedTheories.delete(d.theoryID);
        var theoryID = d.theoryID;
        var refObs = gRelationships.selectAll("#ror"+d.theorySecurityReferentObject);
        var refObID = d.theorySecurityReferentObject;
        refObs.each(function(d){
            if(d3.select(this).attr("data-theoryid") == theoryID){
                d3.select(this)            
                    .transition()
                    .ease(d3.easeCubic)
                    .duration("250")
                    .style("opacity", 0)
                    .remove().on("end", function(){
                        if(gRelationships.selectAll("#ror"+refObID).size() == 0){
                            d3.select("#ro"+refObID).transition()
                               .ease(d3.easeCubic)
                               .duration("100")
                               .style("opacity", 0)
                               .remove();
                            selectedReferentObjects.delete(refObID);   
                        }
                    });
            }
        });
        d3.select("#theoryInfoMore")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0);
        setTimeout(function(){d3.select("#theoryInfoMore")
            .style("display", "none");},250);
        //updateVennDiagram();
        d3.select("#groupsDiv").style("display","block")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 1);
    }
}
// handles adding the theory dimensions
function handleAddRemoveTheoryDimensions(id){
    $(".collapsibleTheoryInfo", "#theoryInfoMore").each(function(){
        $(this).next().children("div").children("button").text("Add to Map+");
    });
    $("#theoryAddAllButton").text("Add all");
    var current = addedTheoryDimensions.get(parseInt(id));
    console.log(addedTheoryDimensions);
    console.log(id);
    if(current == null){
        console.log("returning");
        return;
    }
    Object.keys(current).forEach(function(key,index) {
        if(current[key]){
            var headerArray = $("h4", current[key]).text().split("-")
            var header = headerArray[1].trim();
            $(".collapsibleTheoryInfo", "#theoryInfoMore").each(function(){
                if($(this).text() == header){
                    $(this).next().children("div").children("button").text("Remove from Map-");
                }
            });
        }
    }); 
}

function openAllLogics(){
    $(".collapsibleTheoryInfo").trigger("click");
}
function openAllTheory(){
    $(".collapsibleTheoryInfo").trigger("click");
}
function hideDims(){
    $(".collapsibleTheoryInfo", "#theoryInfoMore").each(function(){
        if(selectedDimension != $(this).attr("id")){
            d3.select("#"+$(this).attr("id")).style("display","none");
        }else{
            $(this).trigger("click");
        }
    });
}

// updates aside-2 to show the most relevant theory data 
function showTheoryData(data, more){
    d3.select("#groupsDiv").transition().ease(d3.easeCubic)
        .duration(250)
        .style("opacity", 0)
        .style("display", "none");
    d3.select("#logicInfo").transition().ease(d3.easeCubic)
        .duration(250)
        .style("opacity",0)
        .style("display", "none"); 
    $("#theoryInfoMore").children().css("display", "block");
    closeAll(); 
    d3.select("#theoryTitleButton")
        .text(data.theoryName + " - " + data.theoryYear + " (No."+data.theoryID+")")
        .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("background", d3.interpolateRainbow(data.theoryGroupIndex/13));
    d3.select("#theorySummary")
        .text(data.theorySummary);
    d3.select("#theoryPrinciples")
        .text(data.theoryPrinciples);
    d3.select("#theoryExample")
        .text(data.theoryExample);
    d3.select("#theoryStructureOfTheInternationalSystem")
        .text(data.theoryStructureOfTheInternationalSystem);
    d3.select("#theoryRelationOfSystemToEnvironment")
        .text(data.theoryRelationOfSystemToEnvironment);
    d3.select("#theoryAgent")
        .text(data.theoryAgent);
    d3.select("#theoryThreatActors")
        .text(data.theoryThreatActors);
    d3.select("#theorySourceOfResilience")
        .text(data.theorySourceOfResilience);
    d3.select("#theoryInterventions")
        .text(data.theoryInterventions);
    d3.select("#theoryStrategy")
        .text(data.theoryStrategy);
    d3.select("#theoryPrimaryAuthors")
        .text(data.theoryPrimaryAuthors);
    d3.select("#theoryLimitations")
        .text(data.theoryLimitations);
    d3.select("#theoryResearchDrawnUpon")
        .text(data.theoryResearchDrawnUpon);
    $.post("getlogicinfofromtheory", {id : lastSelectedID},
        function(data, status){
            var politics = d3.select("#logicsPolitics").text("");
            var tech = d3.select("#logicsTechnology").text("");
            var opp = d3.select("#logicsOpposites").text("");
            var related = d3.select("#logicsCloselyRelated").text("");
            for(datum of data){
                politics.text(politics.text() + datum.logicsName + "\n" + datum.logicsPolitics + "\n\n");
                tech.text(tech.text() + datum.logicsTechnology + "; ");
                opp.text(opp.text() + datum.logicsOppositeLogic + "; ");
                related.text(related.text() +datum.logicsCloselyRelated + "; ");
            }
        });
    if(!more){
        hideDims();
    } 
    d3.select("#theoryInfoMore")
        .style("display", "block")
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 1.0);
    if(selectedKeywords.size > 0){
        findAndHighlightKeywords(); 
    }
}

// highlights the keywords that currently part of the user's selection
function findAndHighlightKeywords(){
    $('p', '#theoryInfoMore').each(function() {
        var current = $(this);
        selectedKeywords.forEach(function(keywordphrase){
            current.mark(keywordphrase, {"each": function(node){
                var button = $(node).parent().parent().prev();
                if(!button.hasClass("active")){
                    button.trigger("click");
                }
            }});
        });
    });
}

// Adds the respective dimension from a logic to the user's selection of dimensions
function handleLogicAddDetail(elem){
    if($(elem).attr("id") == "logicAddAllButton"){
        if($(elem).text() == "Remove all"){
            addedLogicDimensions.delete(lastSelectedLogicID);
            $(".collapsibleContent","#logicInfo").each(function(){
                var collapsible = $(this);
                collapsible.children("button").text("Add to Map+");
                var header = collapsible.prev().text();
                var id = header.toLowerCase().replace(/\s/g,'') +"-" +lastSelectedLogicID;
                $("#"+id).remove();
            });
            $(elem).text("Add all");
        }else{
            var current = addedLogicDimensions.get(lastSelectedLogicID);
            if(current == null){
                current = {};
            }
            $(".collapsibleContent","#logicInfo").each(function(){
                var collapsible = $(this);
                var logicName = d3.select("#c"+lastSelectedLogicID).datum().logicsName;
                var header = collapsible.prev().text();
                var text = collapsible.children("p").text();
                var propertyName = header.toLowerCase().replace(/\s/g, '');
                if(current[propertyName]){
                    return;
                }
                var id = header.toLowerCase().replace(/\s/g,'') +"-" +lastSelectedLogicID;
                var appended = $("<div id='"+id+"' class='elementContainer'>"+
                    "<h4>"+logicName+" - "+header+"</h4>"+
                    "<p>"+text+"</p>"
                    +"</div>").appendTo("#logicContainer");
                $(appended).click(function(){
                    var logicID = $(this).attr("id").split("-")[1]; 
                    $.post("getlogicbyid",
                        { id : logicID }, 
                        function(data, status){
                            showLogicData(data);
                            handleRemoveAdd(logicID);
                        });
                    lastSelectedLogicID = logicID;
                });
                current[propertyName] = appended;
                collapsible.children("div").children("button").text("Remove from Map-");
            });
            addedLogicDimensions.set(lastSelectedLogicID, current);
            $(elem).text("Remove all");
        }
    }else{
        if($(elem).text() == "Remove from Map-"){
            var current = addedLogicDimensions.get(lastSelectedLogicID);
            var collapsible = $(elem).parent().parent();
            $(elem).text("Add to Map+");
            var header = collapsible.prev().text();
            var propertyName = header.toLowerCase().replace(/\s/g, '');
                $(current[propertyName]).remove();
            current[propertyName] = null; 
            addedLogicDimensions.set(lastSelectedLogicID, current); 
        }else{
            $(elem).text("Remove from Map-");
            var current = addedLogicDimensions.get(lastSelectedLogicID);
            if(current == null){
                current = {};
            }
            var collapsible = $(elem).parent().parent();
            var logicName = d3.select("#c"+lastSelectedLogicID).datum().logicsName;
            var header = collapsible.prev().text();
            var text = collapsible.children("p").text();
            var propertyName = header.toLowerCase().replace(/\s/g, '');
            var id = header.toLowerCase().replace(/\s/g,'') +"-" +lastSelectedLogicID;
            var appended = $("<div id='"+id+"' class='elementContainer'>"+
                "<h4>"+logicName+" - "+header+"</h4>"+
                "<p>"+text+"</p>"
                +"</div>").appendTo("#logicContainer");
                $(appended).click(function(){
                    var logicID = $(this).attr("id").split("-")[1]; 
                    $.post("getlogicbyid",
                        { id : logicID }, 
                        function(data, status){
                            showLogicData(data);
                            handleRemoveAdd(logicID);
                        });
                    lastSelectedLogicID = logicID;
                });
            current[propertyName] = appended;
            addedLogicDimensions.set(lastSelectedLogicID, current);
        }
    }
}

// adds the selected dimension from a theory to the user's selection
function handleTheoryAddDetail(elem){
    if($(elem).attr("id") == "theoryAddAllButton"){
        if($(elem).text() == "Remove all"){
            addedTheoryDimensions.delete(lastSelectedID);
            $(".collapsibleContent","#theoryInfoMore").each(function(){
                var collapsible = $(this);
                collapsible.children("button").text("Add to Map+");
                var header = collapsible.prev().text();
                var id = header.toLowerCase().replace(/\s/g,'') +"-" +lastSelectedID;
                $("#"+id).remove();
            });
            $(elem).text("Add all");
        }else{
            var current = addedTheoryDimensions.get(lastSelectedID);
            if(current == null){
                current = {};
                }
            $(".collapsibleContent","#theoryInfoMore").each(function(){
                var collapsible = $(this);
                var theoryName = d3.select("#tc"+lastSelectedID).datum().theoryName;
                var header = collapsible.prev().text();
                var text = collapsible.children("p").text();
                var propertyName = header.toLowerCase().replace(/\s/g, '');
                var theoryGroupID = d3.select("#tc"+lastSelectedID).datum().theoryGroupIndex;
                if(current[propertyName]){
                    return;
                }
                var id = header.toLowerCase().replace(/\s/g,'') +"-" +lastSelectedID;
                var appended = $("<div id='"+id+"' class='elementContainer'>"+
                    "<h4 style='color:"+(d3.interpolateRainbow(theoryGroupID/13))+"'>"+theoryName+" - "+header+"</h4>"+
                    "<p>"+text+"</p>"
                    +"</div>").css("border-color", d3.interpolateRainbow(theoryGroupID/13)).appendTo("#theoryContainer");
                $(appended).click(function(){
                    var theoryID = $(this).attr("id").split("-")[1]; 
                    $.post("gettheorydata", {id : theoryID},
                        function(data, status){
                            if(selectedDimension == null){
                                showTheoryData(data, true);   
                            }
                            else{
                                showTheoryData(data, false); 
                            }
                            handleAddRemoveTheoryDimensions(theoryID);
                            document.getElementById("theoryInfoMore").scrollTop = 0;
                            lastSelectedID = theoryID;
                        });
                });
                current[propertyName] = appended;
                collapsible.children("div").children("button").text("Remove from Map-");
            });
            addedTheoryDimensions.set(lastSelectedID, current);
            $(elem).text("Remove all");
        }
    }else{
        if($(elem).text() == "Remove from Map-"){
            var current = addedTheoryDimensions.get(lastSelectedID);
            var collapsible = $(elem).parent().parent();
            $(elem).text("Add to Map+");
            var header = collapsible.prev().text();
            var propertyName = header.toLowerCase().replace(/\s/g, '');
            $(current[propertyName]).remove();
            current[propertyName] = null; 
            addedTheoryDimensions.set(lastSelectedID, current); 
        }else{
            $(elem).text("Remove from Map-");
            var current = addedTheoryDimensions.get(lastSelectedID);
            if(current == null){
                current = {};
            }
            var collapsible = $(elem).parent().parent();
            var theoryName = d3.select("#tc"+lastSelectedID).datum().theoryName;
            var theoryGroupID = d3.select("#tc"+lastSelectedID).datum().theoryGroupIndex;
            var header = collapsible.prev().text();
            var text = collapsible.children("p").text();
            var id = header.toLowerCase().replace(/\s/g,'') +"-" +lastSelectedID;
            var appended = $("<div id='"+id+"' class='elementContainer'>"+
                "<h4 style='color:"+d3.interpolateRainbow(theoryGroupID/13)+"'>"+theoryName+" - "+header+"</h4>"+
                "<p>"+text+"</p>"
                +"</div>").css("border-color", d3.interpolateRainbow(theoryGroupID/13)).appendTo("#theoryContainer");
            $(appended).click(function(){
                var theoryID = $(this).attr("id").split("-")[1];
                $.post("gettheorydata", {id : theoryID },
                    function(data, status){
                        if(selectedDimension == null){
                            showTheoryData(data, true);   
                        }
                        else{
                            showTheoryData(data, false); 
                        }
                        handleAddRemoveTheoryDimensions(theoryID);
                        document.getElementById("theoryInfoMore").scrollTop = 0;
                        lastSelectedID = theoryID;
                });
            });
            var propertyName = header.toLowerCase().replace(/\s/g, '');
            current[propertyName] = appended;
            addedTheoryDimensions.set(lastSelectedID, current);
        }
    }
}

// Closes all the collapsibles
function closeAll(){
    var coll = document.getElementsByClassName("collapsibleTheoryInfo");
    var i;
    for (i = 0; i < coll.length; i++) {
        coll[i].classList.remove("active"); 
        var content = coll[i].nextElementSibling;
        content.style.maxHeight = null;
    }
}
function showRelationship(data, id){
    if(data.length == 0){
        return;
    }
    for(datum of data){
        gRelationships.append("path").datum(datum, datum.theoryID)
            .attr("d", function(d){
                var logicCircle = g.select("#c"+d.logicID);
                return lineFunction([{"x": logicCircle.attr("cx"), "y" : logicCircle. attr("cy")},
                {"x" : logicCircle.attr("cx"), "y" : (height/6)*2},
                {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : theoryLine.attr("y")-10},
                {"x" : g.select("#tc"+d.theoryID).attr("cx") , "y" : theoryLine.attr("y")}])
            })
            .attr("stroke", function(d){
                return document.getElementById("posNegSwitch").checked == true ? 
                    d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
            })
            .attr("stroke-width", 10)
            .attr("stroke-dasharray", "2")
            .attr("class", "relationships")
            .attr("id", function(d) { return "r"+d.theoryID})
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .style("opacity", 0)
            .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .style("opacity",1);
    }
    var theoryRelatedTo = g.select("#tc"+id);
    gRelationships.append("path")
        .datum(data[0], id)
        .attr("d", function(d){ return lineFunction([{"x": theoryRelatedTo.attr("cx"), "y" : theoryRelatedTo.attr("cy")},
            {"x" : theoryRelatedTo.attr("cx"), "y" : (height/3)*2},
            {"x" : g.select("#roc"+d.theorySecurityReferentObject).attr("cx") , "y" : refObLine.attr("y")-10},
            {"x" : g.select("#roc"+d.theorySecurityReferentObject).attr("cx") , "y" : refObLine.attr("y")}])
    })
    .attr("stroke", function(d){
        return document.getElementById("posNegSwitch").checked == true ? 
            d3.select("#tc"+d.theoryID).attr("data-posneg") : d3.interpolateRainbow(d.theoryGroupIndex/13);
    })
    .attr("stroke-width", 10) 
    .attr("stroke-dasharray", "2")
    .attr("class", "relationships")
    .attr("id", function(d) { return "ror"+d.theorySecurityReferentObject})
    .attr("data-theoryid", function(d) { 
        return d.theoryID })
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .style("opacity", 0)
    .transition().ease(d3.easeCubic).duration("250").style("opacity",1);
}
function selectLogicAndShow(d,i){
    var circle = d3.select("#c"+d.id);
    var text = d3.select("#t"+d.id); 
    if(circle.attr("data-clicked") == 0 || text.attr("data-clicked") == 0){
        $.post("getlogicbyid",
            { id : d.id }, 
            function(data, status){
                selectedLogics.push(d.id);
                selectedLogicsMap.set(d.id, d.logicsName); 
                
                showLogicData(data);
                handleRemoveAdd(d.id);
                if(selectedKeywords.size > 0){
                    getTheoriesFromKeywords();
                }else{
                   // if(document.getElementById("theoryLineSwitch").checked == true){
                   // $.post("gettheoriesbylogicsTimeline", { ids : selectedLogics },
                   //     update);
                   // }else{
                        $.post("gettheoriesbylogics", { ids : selectedLogics },
                            updateMap);
                    //}
                }
        });
        lastSelectedLogicID = d.id;
        circle.attr("data-clicked",1);
        text.attr("data-clicked",1);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("r", 20)
            .attr("stroke-width", "3px")
            .attr("stroke-dasharray", "5 2");
        text.transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#212121");
    }else{
        d3.select("#logicInfo").transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 0.0)
            .on("end", function(){
                d3.select("#logicInfo")
                    .style("display", "none");
            });
        d3.select("#groupsDiv").style("display", "block").transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", 1);

        circle.attr("data-clicked",0);
        text.attr("data-clicked",0);
        circle.transition()
            .ease(d3.easeCubic)
            .duration("200")
            .attr("r", 15)
            .attr("stroke-width", 0);
        text.transition()
            .ease(d3.easeCubic)
            .duration("200")
            .attr("fill","#5b5b5b"); 
        selectedLogicsMap.delete(d.id); 
        selectedLogics.splice(selectedLogics.findIndex(function(id){ return id == d.id }),1);
        if(selectedKeywords.size > 0){
            getTheoriesFromKeywords();
        }else{ 
            $.post("gettheoriesbylogics", { ids : selectedLogics },
                updateMap);
        }
    }
}
function handleRemoveAdd(id){
    $(".collapsibleTheoryInfo", "#logicInfo").each(function(){
        $(this).next().children("div").children("button").text("Add to Map+");
    });
    $("#logicAddAllButton").text("Add all");
    var current = addedLogicDimensions.get(parseInt(id));
    if(current == null){
        return;
    }
    Object.keys(current).forEach(function(key,index) {
        if(current[key]){
            var headerArray = $("h4", current[key]).text().split("-")
            var header = headerArray[1].trim();
            $(".collapsibleTheoryInfo", "#logicInfo").each(function(){
                if($(this).text() == header){
                    $(this).next().children("div").children("button").text("Remove from Map-");
                }
            });
        }
    }); 
}
function showLogicData(data){
    // hide the theory div
    d3.select("#theoryInfoMore").transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity",0)
        .style("display", "none"); 
    d3.select("#groupsDiv").transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 0)
        .style("display", "none"); 
    d3.select("#logicTitleButton")
        .text(data.logicsName + " Security Logic")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("background", function(){
                return data.logicsPositiveSecurity == 1 ? "#98e29a" : "#e08888";
            });
    d3.select("#logicsSummary")
        .text(data.logicsSummary);
    d3.select("#logicsCommentary")
        .text(data.logicsCommentary);
    d3.select("#logicsObjects")
        .text(data.logicsObjects);
    d3.select("#logicsMainPolitics")
        .text(data.logicsPolitics);
    d3.select("#logicsMainTechnology")
        .text(data.logicsTechnology);
    d3.select("#logicsMainOpposingLogics")
        .text(data.logicsOppositeLogic);
    d3.select("#logicsMainCloselyRelated")
        .text(data.logicsCloselyRelated);
    d3.select("#logicsExemplars")
        .text(data.logicsExemplars);
    d3.select("#logicsReferences")
        .text(data.logicsReferences);
    d3.select("#logicInfo")
        .style("display", "block")
        .transition()
        .ease(d3.easeCubic)
        .duration("250")
        .style("opacity", 1.0);
    document.getElementById("logicInfo").scrollTop = 0;
}

function mouseOverLogicName(d, i) { 
    if(d3.select(this).attr("data-clicked") == 0){
        d3.select("#c"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("r", 20);
        d3.select(this).transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#212121");
    }
}

function mouseOutLogicName(d, i) {
    if(d3.select(this).attr("data-clicked") == 0){
        d3.select("#c"+d.id).transition()
           .ease(d3.easeCubic)
           .duration("200")   
           .attr("r", 15);
        d3.select(this).transition()
           .ease(d3.easeCubic)
           .duration("200")
           .attr("fill","#5b5b5b");
    }
}
function mouseOverLogicCircle(d, i) { 
    if(d3.select(this).attr("data-clicked") == 0){
        d3.select(this).transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("r", 20);
        d3.select("#t"+d.id).transition()
            .ease(d3.easeCubic)
            .duration("500")
            .attr("fill", "#212121");
    }
}

function mouseOutLogicCircle(d, i) {
    if(d3.select(this).attr("data-clicked") == 0){
        d3.select(this).transition()
           .ease(d3.easeCubic)
           .duration("200")   
           .attr("r", 15);
        d3.select("#t"+d.id).transition()
           .ease(d3.easeCubic)
           .duration("200")
           .attr("fill","#5b5b5b");
    }
}

// Handles the initial rendering of the SVG
function renderSVG(){
    width = document.getElementById('mapContainer').offsetWidth;
    height = document.getElementById('mapContainer').offsetHeight;
    svg = d3.select(".mapContainer")
        .append("svg")
        .attr("id","map") 
        .style("opacity", 0)
        .attr("width", width)
        .attr("height", height)
        .style("pointer-events", "none")
    svg.append("rect")
        .attr("fill", "#fff")
        .attr("id", "backgroundrect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);
    var svgDefs = svg.append("defs");
    var anteGradient = svgDefs.append("linearGradient")
        .attr("id", "anteGradient");
    anteGradient.append("stop")
        .attr('class', 'stop-leftAnte')
        .attr("offset", "0");
    anteGradient.append("stop")
        .attr("class", "stop-rightAnte")
        .attr("offset", "1");
    var mainGradient = svgDefs.append("linearGradient")
        .attr('id', 'mainGradient');
    mainGradient.append('stop')
                .attr('class', 'stop-left')
                .attr('offset', '0');

    mainGradient.append('stop')
                .attr('class', 'stop-right')
                .attr('offset', '1');
    gMain = mainMapG = svg.append("g");
    gRelationships = gMain.append("g");
    g = gMain.append("g").attr("id", "mainBehind");

    theoryLine = g.append("rect")
        //.classed("filled", true)
        .attr("x", 0)
        .attr("y", (height/2)+30)
        .attr("width", width)
        .attr("height", 3)
        .attr("fill", "#ccc")
        .attr("rx","5")
        .attr("ry","5");
    
    refObLine = g.append("rect")
        //.classed("filledAnte", true)
        .attr("x", 0)
        .attr("y", ((height/5)*4)+50)
        .attr("width", width)
        .attr("height", 3)
        .attr("fill", "#444444")
        .attr("rx","5")
        .attr("ry","5")
        .style("opacity", 0);
    
    g.append("text")
        .attr("id", "theoryLabel")
        .attr("x", width/2)
        .attr("y", parseInt(theoryLine.attr("y"))+40)
        .attr("text-anchor", "middle")
        .text("Theories")
        .style("font-family", "'Roboto', sans-serif")
        .attr("fill", "#3d3d3d")
        .style("font-size", "13px");

    g.append("text")
        .attr("id", "refObLabel")
        .attr("x", width/2)
        .attr("y", parseInt(refObLine.attr("y"))+40)
        .attr("text-anchor", "middle")
        .text("Referent Objects")
        .style("font-family", "'Roboto', sans-serif")
        .attr("fill", "#3d3d3d")
        .style("font-size", "13px");

    g.append("text")
        .attr("id", "scrollDownLabel")
        .attr("x", width/2)
        .attr("y", parseInt(refObLine.attr("y"))+90)
        .attr("text-anchor", "middle")
        .text("Scroll down to see more of your map")
        .style("font-family", "'Roboto', sans-serif")
        .attr("fill", "#3d3d3d")
        .style("font-size", "11px");
   
    var infoButton = g.append("rect")
        .attr("id", "info")
        .attr("x", width - 50)
        .attr("y", 20)
        .attr("rx", "3")
        .attr("ry", "3")
        .attr("width", 30)
        .attr("height", 30)
        .attr("fill", "#c9c9c9")
        .attr("data-selected", 0)
        .style("cursor","pointer")
        .on("click", handleShowInfo)
        .on("mouseover", infoMouseover)
        .on("mouseout", infoMouseout)
        
    g.append("svg:image")
        .attr("x", infoButton.attr("x"))
        .attr("id", "infoImg")
        .attr("y", infoButton.attr("y"))
        .attr("width", 30)
        .attr("height", 30)
        .style("cursor", "pointer")
        .attr("xlink:href", "info.png")
        .on("click", handleShowInfo)
        .on("mouseover", infoMouseover)
        .on("mouseout", infoMouseout)
        .append("svg:title")
        .text("Show/Hide info");
    var settingsButton = g.append("rect")
        .attr("id", "settings")
        .attr("x", 20)
        .attr("y", 20)
        .attr("rx", "3")
        .attr("ry", "3")
        .attr("width", 30)
        .attr("height", 30)
        .attr("fill", "#c9c9c9")
        .attr("data-selected", 0)
        .style("cursor","pointer")
        .on("click", showSettings)
        .on("mouseover", settingsMouseover)
        .on("mouseout", settingsMouseout);
    g.append("svg:image")
        .attr("x", settingsButton.attr("x"))
        .attr("id", "settingsImg")
        .attr("y", settingsButton.attr("y"))
        .attr("width", 30)
        .attr("height", 30)
        .style("cursor", "pointer")
        .attr("xlink:href", "settings.png")
        .on("click", showSettings)
        .on("mouseover", settingsMouseover)
        .on("mouseout", settingsMouseout)
        .append("svg:title")
        .text("Show/Hide settings");
    //svg.append("foreignObject")
    //    .attr("width", )
    //    .attr("height", 500)
    //    .append("xhtml:body")
    //    .style("font", "14px 'Helvetica Neue'")
    //    .html("<h1>An HTML Foreign Object in SVG</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eu enim quam. Quisque nisi risus, sagittis quis tempor nec, aliquam eget neque. Nulla bibendum semper lorem non ullamcorper. Nulla non ligula lorem. Praesent porttitor, tellus nec suscipit aliquam, enim elit posuere lorem, at laoreet enim ligula sed tortor. Ut sodales, urna a aliquam semper, nibh diam gravida sapien, sit amet fermentum purus lacus eget massa. Donec ac arcu vel magna consequat pretium et vel ligula. Donec sit amet erat elit. Vivamus eu metus eget est hendrerit rutrum. Curabitur vitae orci et leo interdum egestas ut sit amet dui. In varius enim ut sem posuere in tristique metus ultrices.<p>Integer mollis massa at orci porta vestibulum. Pellentesque dignissim turpis ut tortor ultricies condimentum et quis nibh. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer euismod lorem vulputate dui pharetra luctus. Sed vulputate, nunc quis porttitor scelerisque, dui est varius ipsum, eu blandit mauris nibh pellentesque tortor. Vivamus ultricies ante eget ipsum pulvinar ac tempor turpis mollis. Morbi tortor orci, euismod vel sagittis ac, lobortis nec est. Quisque euismod venenatis felis at dapibus. Vestibulum dignissim nulla ut nisi tristique porttitor. Proin et nunc id arcu cursus dapibus non quis libero. Nunc ligula mi, bibendum non mattis nec, luctus id neque. Suspendisse ut eros lacus. Praesent eget lacus eget risus congue vestibulum. Morbi tincidunt pulvinar lacus sed faucibus. Phasellus sed vestibulum sapien.");
    
    g.append("text") 
        .attr("id","downloadImg")
        .attr("x", 60)
        .attr("y", 40) 
        .text("Export My Map")
        .attr("fill", "#87ceeb")
        .style("cursor", "pointer")
        .style("font-family", "'Roboto', sans-serif")
        .on("click", handleMainExport);
     g.append("text") 
        .attr("id","mapTitle")
        .attr("x", width/2)
        .attr("y", 40) 
        .text("")
        .attr("fill", "#000")
        .attr("text-anchor", "middle")  
        .style("font-family", "'Roboto', sans-serif");

    //g.append("svg:image")
    //    .attr("x", downloadRect.attr("x"))
    //    .attr("id", "downloadImg")
    //    .attr("y", downloadRect.attr("y"))
    //    .attr("width", 30)
    //    .attr("height", 30)
    //    .attr("fill", "white")
    //    .style("cursor", "pointer")
    //    .attr("xlink:href", "download.png")
    //    .on("click", handleMainExport)

    g.append("g")
        .attr("id", "venn")
        .style("opacity", 1);
    svg.transition()
        .ease(d3.easeCubic)
        .duration(1000)
        .style("opacity",1)
        .on("end", function(){
            svg.style("pointer-events", "all");
        });

}

function showSettings(){
    var settings = g.select("#settings");
    if(settings.attr("data-selected") == 0){
        settings.attr("data-selected", 1)
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5e5e5e")
        d3.select(".aside-1").style("display", "block")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", "1");
        if(g.select("#info").attr("data-selected") == 1){
            d3.select(".main").style("width", "60%");
        }else{
            d3.select(".main").style("width", "80%");
        }
        redraw();
    }else{
        settings.attr("data-selected", 0);
        d3.select(".aside-1")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", "0").on("end", function(){
                d3.select(this).style("display", "none");

                if(g.select("#info").attr("data-selected") == 1){
                    d3.select(".main").style("width", "80%");
                }else{
                    d3.select(".main").style("width", "100%");
                }
                redraw();
            });
    }
}
function infoMouseover(){
    if(g.select("#info").attr("data-selected") == 0){
        g.select("#info")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5e5e5e")
    }
}

function infoMouseout(){
    if(g.select("#info").attr("data-selected") == 0){
            g.select("#info")
                .transition()
                .ease(d3.easeCubic)
                .duration("250")
                .attr("fill", "#c9c9c9")
        }
}
function handleShowInfo(){
    var info = g.select("#info");
    if(info.attr("data-selected") == 0){
        info.attr("data-selected", 1)
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5e5e5e")
        d3.select(".aside-2").style("display", "block")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", "1");
        if(g.select("#settings").attr("data-selected") == 1){
            d3.select(".main").style("width", "60%");
        }else{
            d3.select(".main").style("width", "80%");
        }
        redraw();
    }else{
        info.attr("data-selected", 0);
        d3.select(".aside-2")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .style("opacity", "0").on("end", function(){
                d3.select(this).style("display", "none");

                if(g.select("#settings").attr("data-selected") == 1){
                    d3.select(".main").style("width", "80%");
                }else{
                    d3.select(".main").style("width", "100%");
                }
                redraw();
            });
    }
}
function settingsMouseover(){
    if(g.select("#settings").attr("data-selected") == 0){
        g.select("#settings")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#5e5e5e")
    }
}

function settingsMouseout(){
    if(g.select("#settings").attr("data-selected") == 0){
        g.select("#settings")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("fill", "#c9c9c9")
    }
}

function handleFsMouseover(){
    if(d3.select("#fullscreen").attr("data-selected") == 1){
        d3.select("#fullscreenRect")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("width", 15)
            .attr("height", 15);
    }else{
        d3.select("#fullscreenRect")
            .transition()
            .ease(d3.easeCubic)
            .duration("250")
            .attr("width", 30)
            .attr("height", 30);
    }
}
function hideVennDiagram(){
    g.select("#venn")
        .transition().ease(d3.easeCubic).duration("250")
        .style("opacity",0).on("end", function(){
            d3.select(this).style("display", "none");
        });
}
function updateVennDiagram(){
    if(selectedTheories.size > 0){
        $.post("gettheoriesbytheoriesinnerjoin", { ids : Array.from(selectedTheories.keys())},
            function(data, status){
                var theVenn = g.select("#venn")
                    .datum(getSets(getPowerset(getLogicsOfSelectedTheories(data)), data))
                    .call(chart).style("display", "block").transition().ease(d3.easeCubic).duration("250")
                        .style("opacity", 1);
                theVenn.selectAll("text").style("font-size", "12px").style("font-family","'Roboto', sans-serif");
                theVenn.select("svg")
                    .attr("x", width - 300)
                    .attr("y", 30)
            });
    }else{
        hideVennDiagram(); 
    }
}

function getLogicsOfSelectedTheories(data){
    var containsLogics = new Set();
    for(datum of data){
        containsLogics.add(datum.logicsID);    
    }
    return Array.from(containsLogics);
}
function getSets(powersetArray, dataArray){
    var sets = [];
    for(logicSet of powersetArray){
        var contains = new Set();
        // go through all the data
        for(datum of dataArray){
            // if the theory belongs to the logic that is the first element:
            if(datum.logicsID == logicSet[0]){
                contains.add(datum.theoryID);
            }
        }
        // if there is more than one logic ->
        if(logicSet.length > 1){
            // for all the othe logics
            for(var i = 1; i < logicSet.length; i++){
                // check whether this theory is in the intersection
                var belongingToThisLogic = new Set();
                for(datum of dataArray){
                    if(datum.logicsID == logicSet[i]){
                        belongingToThisLogic.add(datum.theoryID);
                    }
                }
                contains.forEach(function(theoryID){
                    if(!belongingToThisLogic.has(theoryID)){
                        contains.delete(theoryID);
                    }
                });
            }
        }
        var actualSetNames = [];
        for(logic of logicSet){
            actualSetNames.push(g.select("#c"+logic).datum().logicsName); 
        }
        sets.push({sets : actualSetNames, size: contains.size});
    }
    return sets;
}

function getPowerset(array){
    var result = [];
    for (var i = 1; i < (1 << array.length); i++) {
        var subset = [];
        for (var j = 0; j < array.length; j++){
            if (i & (1 << j)){
                subset.push(array[j]);
            } 
        }
        result.push(subset);
    }
    return result;
}
function handleMainExport(){
    g.select("#downloadImg").style("display", "none");
    g.select("#info").style("display", "none");
    g.select("#settings").style("display", "none");
    g.select("#scrollDownLabel").style("display","none");
    
    redrawWithParams(3508/2,2480/2);
    var svgString = getSVGString(svg.node());
    svgString2Image( svgString, 3508/2, 2480/2, 'png', save );
    
    g.select("#downloadImg").style("display", "block");
    g.select("#info").style("display", "block");
    g.select("#settings").style("display", "block");
    g.select("#scrollDownLabel").style("display","none");
    function save(pngData){    
        var doc = new jsPDF({
            orientation : "l",
            unit: "mm",
            format: "a4"
        });
        //2480px x 3508px
        var width = doc.internal.pageSize.getWidth();
        var height = doc.internal.pageSize.getHeight();
        doc.addImage(pngData, 'PNG', 0,0,width,height);
        //doc.addHTML($("#completeInfoContainer").get(0), function(){
        //    doc.save("map.pdf");
        //});
        doc.save("map.pdf");
    }
    redraw();
}
function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			
			try {
			    if(!s.cssRules) continue;
			} catch( e ) {
		    		if(e.name !== 'SecurityError') throw e; // for Firefox
		    		continue;
		    	}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}
		

		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css"); 
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	var format = format ? format : 'png';
	var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	var image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);
        callback(canvas.toDataURL("image/"+format));
	};
	image.src = imgsrc;
}


function getMaxLogicID(data){
    var maxID = data[0].id;
    for(row of data){
        if(row.id > maxID){
            maxID = row.id;
        }
    }  
    return maxID;
}
function getMinLogicID(data){
    var minID = data[0].id;
    for(row of data){
        if(row.id < minID){
            minID = row.id;
        }
    }
    return minID;
}
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
}
