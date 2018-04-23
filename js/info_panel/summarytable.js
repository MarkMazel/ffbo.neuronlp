// Adapted from https://stackoverflow.com/a/30538574
if( moduleExporter === undefined){
  var moduleExporter = function(name, dependencies, definition) {
    if (typeof module === 'object' && module && module.exports) {
      dependencies = dependencies.map(require);
      module.exports = definition.apply(context, dependencies);
    } else if (typeof require === 'function') {
      define(dependencies, definition);
    } else {
      window[name] = definition();
    }
  };
}

moduleExporter("SummaryTable",
	       ['jquery','d3','overlay','modernizr'],
	       function($,d3,Overlay,Modernizr)
{
  /**
   * SummaryTable Information Constructor
   * @constructor
   * @param {string} div_id -  ID for div in which to create SummaryTable
   * @param {obj} parentObj -  parentObject
   * @param {dict} [nameConfig={}] - configuration of children divs. The 3 children divs in ConnTable are `['colorId','extraImgId','overlayId']`
   */
  function SummaryTable(div_id, parentObj, nameConfig={}){
    this.divId = div_id;  // wrapper
    this.parentObj = parentObj;
    
    // nameConfig = nameConfig || {};
    Object.defineProperty(this, "colorId",{
      value: nameConfig.colorId || "info-panel-summary-neu-col",
      configurable: false,
      writable: false
    });
    Object.defineProperty(this, "extraImgId",{
      value: nameConfig.extraImgId || "info-panel-extra-img",
      configurable: false,
      writable: false
    });
    Object.defineProperty(this,"overlayId",{
      value: nameConfig.overlayId || "info-panel-extra-img-viewer-overlay",
      configurable: false,
      writable: false
    });
    
    $('#'+this.overlayId).remove();
    this.overlay = new Overlay(this.overlayId,'<img></img><h2></h2>');
    
    this.htmlTemplate = createTemplate(this);
    this.dom = document.getElementById(this.divId);
    this.reset();
  }

  /**
   * Create HTML template
   * @param {obj} obj - SummaryTable Instance
   */
  function createTemplate(obj){
    var template = "";
    template += '<table class="table table-inverse table-custom-striped"><tbody></tbody></table>';
    template += '<div id="' + obj.extraImgId + '" class="row">';
    template += '<div class="col-md-4" style="display:none"><h4>Confocal Image</h4><img class="clickable-image" style="width:100%" alt="not available"></div>';
    template += '<div class="col-md-4" style="display:none"><h4>Segmentation</h4><img class="clickable-image" style="width:100%" alt="not available"></div>';
    template += '<div class="col-md-4" style="display:none"><h4>Skeleton</h4><img class="clickable-image" style="width:100%" alt="not available"></div>';
    template += '</div>';
    return template;
  }

  /*
   * Reset SummaryTable Table
   */
  SummaryTable.prototype.reset = function (){
    // purge div and add table
    this.dom.innerHTML = this.htmlTemplate;
  };


  /**
   * SummaryTable Information show
   */
  SummaryTable.prototype.show = function (){
    $('#'+this.divId).show();
    $('#'+this.extraDivId).show();
  };
  /**
   * SummaryTable Information hide
   */
  SummaryTable.prototype.hide = function (){
    $('#'+this.divId).hide();
    $('#'+this.extraDivId).hide();
  };

  SummaryTable.prototype.resize = function(){
    return;
  };

  /**
   * Convert snake_case to Sentence Case
   *
   * @param {string} word_in_snake - Word in snake_case
   */
  
  function snakeToSentence(word_in_snake){
    return word_in_snake.split("_")
                         .map(word => word.charAt(0).toUpperCase()+word.slice(1))
                         .join(" ");
  }
  
  /**
   * Verify integrity of data
   */
  function verifyDataIntegrity(data){
    let integrity = 1;
    return integrity && data;
  }
  
  /**
   * SummaryTable Information Update
   *
   */
  SummaryTable.prototype.update = function(data){

    if (verifyDataIntegrity(data) == false){
      return;
    }
    
    this.reset();
    $('#'+this.divId).show(); // show summary information


    // extra name and color
    var objName = ('uname' in data) ? data['uname'] : data['name'];
    if (data['class'] === 'Synapse'){
      objName = "Synapse between" + objName.split("--")[0]+ " and " + objName.split("--")[1];
    }
    var objRId = data['rid'];
    var objColor = this.parentObj.getAttr(objRId,'color');
    
    var tableHtml = '<tr><td>Name :</td><td>' + objName;
    
    if (this.parentObj.isInWorkspace(objRId)){
      tableHtml += '<button class="btn btn-remove btn-danger" id="btn-add-' + objName + '" name="'+ objName + '" style="margin-left:20px;">-</button>';
    }else{
      tableHtml += '<button class="btn btn-add btn-success" id="btn-add-' + objName + '" name="'+ objName +  '" style="margin-left:20px;">+</button>';
    }
    tableHtml +=  '</td>';
    
    
    if (objColor){
      // add choose color
      tableHtml += '<td>Choose Color</td><td> <input class="color_inp"';
      if(Modernizr.inputtypes.color){
        tableHtml+='type="color"';
      }else{
        tableHtml+='type="text"';
      }
      tableHtml+='name="neu_col" id="' + this.colorId+ '" value="#' + objColor  + '"/></td></tr>';
      
    }else{
      tableHtml += '<td></td></tr>';
    }
      
    let displayKeys = ['class','vfb_id','data_source','transgenic_lines','transmitters','expresses'];
    var displayCtr = 0;
    tableHtml += '<tr>';

    let keyCounter = 0;
    for (let key of displayKeys){
      if (!(key in data) || data[key] == 0){
	continue;
      }

      let fieldName = snakeToSentence(key);
      let fieldValue = data[key];
      
      if (fieldName === 'vfb_id'){
        let vfbBtn = "<a target='_blank' href='http://virtualflybrain.org/reports/" + data[key] + "'>VFB link</a>";
	fieldName = 'External Link';
	fieldValue = vfbBtn;
      }
      
      
      if (keyCounter % 2 === 0){
        tableHtml += "<tr><td>" + fieldName + ":</td><td>" + fieldValue +"</td>" ;
      }else{
        tableHtml += "<td>" + fieldName + ":</td><td>" + fieldValue +"</td></tr>" ;
      }
      keyCounter += 1;
    }
    
    if (tableHtml.substr(tableHtml.length-5) !== '</tr>'){
      tableHtml += '<td></td><td></td></tr>';
    }

    $('#'+this.divId + " tbody").html(tableHtml);
    
    // set callback <TODO> check this 
    if(!Modernizr.inputtypes.color){
      $('#'+this.colorId).spectrum({
        showInput: true,
        showPalette: true,
        showSelectionPalette: true,
        showInitial: true,
        localStorageKey: "spectrum.neuronlp",
        showButtons: false,
        move: (c) => {
          this.parentObj.setAttr(objRId,'color', c.toHexString());	    
          }
      });
    }
    else{
      $('#'+this.colorId).on('change',(c) => {
	this.parentObj.setAttr(objRId,'color', $('#'+this.colorId)[0].value);
      });
    }
    
    // flycircuit data
    if (('data_source' in data) && (data['data_source'].indexOf("FlyCircuit") > -1)) { // see if flycircuit is in
      let extraTableHtml = "";
      var extraData = data['flycircuit_data'];
      let extraKeys = ["Lineage", "Author", "Driver", "Gender/Age",  "Soma Coordinate", "Putative birth time", "Stock"];
      if (!('error' in extraData)){
	// Fetch Key:value pair for flycircuit_data and add to
	let keyCounter = 0;
	for (let key of extraKeys){
	  if (!(key in extraData) || extraData[key] == 0){
	    continue;
	  }
	  if (keyCounter % 2 === 0){
            extraTableHtml += "<tr><td>" + key + ":</td><td>" + extraData[key] +"</td>" ;
          }else{
            extraTableHtml += "<td>" + key + ":</td><td>" + extraData[key] +"</td></tr>" ;
          }
	  keyCounter += 1;
	}
	
	if (extraTableHtml.substr(extraTableHtml.length-5) !== '</tr>'){
	  extraTableHtml += '<td></td><td></td></tr>';
	}

        $('#'+this.divId+ " tbody").append(extraTableHtml);

        // set source for images
	if ("Images" in extraData){
          let imgList = ["Original confocal image (Animation)","Segmentation","Skeleton (download)"];
          Object.entries(imgList).forEach(
            ([idx,imgName]) => {
              $('#'+this.extraImgId + " img")[idx].onerror = function(){
                console.log("[InfoPanel.SummaryTable] Image "+ imgName + " not found!");
                this.style.display = "none";
              };
              $('#'+this.extraImgId + " img")[idx].onload = function(){
                console.log("[InfoPanel.SummaryTable] Image "+ imgName + " loaded!");
                this.style.display = "block";
              };
              if (extraData["Images"][imgName]){
                let _source = extraData["Images"][imgName];
                $('#'+this.extraImgId + " img")[idx].src = _source;                
                // add overlay callback
                $('#'+this.extraImgId + " img")[idx].onclick = () => {
                  this.overlay.update('<img src="' + _source + '"></img><h2>' + imgName + '</h2>');
                  this.overlay.show();
                };
              }else{
                $('#'+this.extraImgId + " img")[idx].style.display = "none";
              }
            });
          $("#" + this.extraImgId).show();
        }        
      }
    }

    this.setupCallbacks();
    
  };

  /**
   * Setup Callback for add remove button
   */
  SummaryTable.prototype.setupCallbacks = function(){
    let that = this;
    $("#"+that.divId + " button").click(function(){
      if(this.className.includes('add')){
        that.parentObj.addByUname(this.name);
      }else{
        that.parentObj.removeByUname(this.name); 
      }        
    });
  };

  

  return SummaryTable;
});