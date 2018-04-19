// Adapted from https://stackoverflow.com/a/30538574                                                                                                                                                                                  
if( moduleExporter === undefined){
  var moduleExporter = function(name, dependencies, definition) {
    if (typeof module === 'object' && module && module.exports) {
      dependencies = dependencies.map(require);
      module.exports = definition.apply(context, dependencies);
    } else if (typeof require === 'function') {
      define(dependencies, definition);
    } else {
      window[name] = eval("definition(" + dependencies.toString() + ")");
    }
  };
}
moduleExporter("ConnTable",
  ['jquery',
	'd3',
	'app/info_panel/pre_process',
  'app/overlay'],
  function(
  	$,
  	d3,
  	preprocess,
    Overlay)
{
  // const svgWrapperId = "#svg-syn";
  // const synProfileInfoWrapperId =  "#syn-profile-info";  
  // const synProfileTextId =  "#syn-reference-text"; 

  function ConnTable(div_id,func_isInWorkspace, nameConfig={}){
    this.divId = div_id;  // wrapper

    // nameConfig = nameConfig || {};
    Object.defineProperty(this,"preTabId",{
      value: nameConfig.preTabId || "#info-panel-table-pre" ,
      configurable: false,
      writable: false
    })
    Object.defineProperty(this,"postTabId",{
      value: nameConfig.postTabId || "#info-panel-table-post" ,
      configurable: false,
      writable: false
    })
    Object.defineProperty(this,"overlayId",{
      value: nameConfig.overlayId || "#info-panel-overlay" ,
      configurable: false,
      writable: false
    })

    this.isInWorkspace = func_isInWorkspace;
    this.overlay = new Overlay(this.overlayId.slice(1),"");

    this.htmlTemplate = createTemplate(this);
    this.dom = document.getElementById(this.divId.slice(1));
    this.reset();
  }


  /**
   * Create HTML template
   */
  function createTemplate(obj){
    var template = "";
    template = "";
    template += '<div id ="' + obj.overlayId.slice(1) + '" class="overlay"></div>'
    template += '<h4>Presynaptic Partners</h4>';
    template += '<table id="' + obj.preTabId.slice(1) + '" class="table table-inverse table-custom-striped">';
    template += '<thead><tr class=""><th>Neuron</th> <th>Number of Synapses</th> <th class="neuron_add_pre">+/- Neuron</th><th class="synapse_add_pre">+/- Synapses</th></tr><tr class=""><th><span class="info-input-span"> Filter by name <br></span><input type="text" id="presyn-srch" value="" class="info-input"/></th> <th><span class="info-input-span"> N greater than <br></span><input type="number" id="presyn-N" value="5" class="info-input selectable"/></th> <th class="neuron_add_pre"></th><th class="synapse_add_pre"></th></tr></thead>';
    template += '<tbody></tbody></table>';  
    template += '<h4>Postsynaptic Partners</h4>'
    template += '<table id="' + obj.postTabId.slice(1) + '" class="table table-inverse table-custom-striped">';
    template += '<thead><tr  class=""><th>Neuron</th> <th>Number of Synapses</th> <th class="neuron_add_post">+/- Neuron</th><th class="synapse_add_post">+/- Synapses</th></tr><tr class=""><th><span class="info-input-span"> Filter by name <br></span><input type="text" id="postsyn-srch" value="" class="info-input"/></th> <th><span class="info-input-span"> N greater than <br></span><input type="number" id="postsyn-N" value="5" class="info-input selectable"/></th> <th class="neuron_add_post"></th><th class="synapse_add_post"></th></tr></thead>';
    template += '<tbody></tbody></table>';  
    return template;
  }  

  /*
   * Reset Connectivity Table
   */
  ConnTable.prototype.reset = function (){
    // purge div and add table
    this.dom.innerHTML = this.htmlTemplate;
  }

  /**
  * hide all subcomponents
  */
  ConnTable.prototype.hide = function(data){
    $(this.preTabId).hide();
    $(this.postTabId).hide();
    $(this.divId).hide();
  }

  /**
  * show all subcomponents
  */
  ConnTable.prototype.show = function(data){
    $(this.preTabId).show();
    $(this.postTabId).show();
    $(this.divId).show();
  }

  /**
  * Update synpatic reference and table
  */
  ConnTable.prototype.update = function(data,inferred){
    // show synaptic table
    if (data === undefined){
      this.hide();
      return;
    }
    this.reset();

    if (inferred){
      const btnMoreInfo = '<a id="inferred-details-pre" class="info-panel-more-info inferred-more-info"> <i class="fa fa-info-circle" aria-hidden="true"></i></a>';
      $(this.divId + " h4").html('Inferred Presynaptic Partners' + btnMoreInfo);
      $(this.divId + " h4").html('Inferred Postsynaptic Partners'+ btnMoreInfo);

      $(".inferred-more-info").click(function(){
        info = "<h2>Inferred Synaptic Partners</h2>";
        $(this.overlayId + " .container").html(info + data['description']);

        //mm_menu_right.close();// ?where is this

        // setTimeout( function() {
        //   closeAllOverlay(true);
        //   $(infoOverlay).slideDown(500);
        // }, 500);
      });
    }else{
      $(this.divId + " h4").html("Presynaptic Partners");
      $(this.divId + " h4").html("Postsynaptic Partners");
    }

    // create table
    this.updateTable(data,'pre');    
    this.updateTable(data,'post');
    this.show();
  }

  /**
    * Update synaptic partners table
    *  @data
    *  @connDir: 'pre'/'post'  
    */
  ConnTable.prototype.updateTable = function(data,connDir){
    if(!(connDir in data)){
      return
    }
    if (connDir === 'pre'){
      // pre/post tbody
      var table = $(this.preTabId + " tbody")[0];
      // reset table
      $(this.preTabId + " tbody tr").remove();
    }else{
      // pre/post tbody
      var table = $(this.postTabId + " tbody")[0];
      // reset table
      $(this.postTabId + " tbody tr").remove();

    }
    // flags for detecting if neuron or synapses have been added
    let neuron_add = false;
    let synapse_add = false;
    for(x in data[connDir]['details']){
      d = data[connDir]['details'][x];
      name = "";
      N = "";

      if('label' in d){
        name = d['label'];
      }else if('uname' in d) {
        name = d['uname'];
      }else if('name' in d) {
        name = d['name'];
      }else {
        name = d['rid'];
      }
      if('N' in d) {
        N = d['N'];
      }
      var row = table.insertRow(0);
      var c1 = row.insertCell(0);
      var c2 = row.insertCell(1);
      var c3 = row.insertCell(2);
      c3.className = (connDir==='pre') ? 'neuron_add_pre': 'neuron_add_post'; // remove the . character
      var c4 = row.insertCell(3);
      c4.className = (connDir==='pre') ? 'synapse_add_pre': 'synapse_add_post';

      c1.innerHTML = name;
      c2.innerHTML = N;

      // generate add/remove button for each neuron
      if(d['has_morph'] && 'uname' in d){
        var btn = document.createElement('button');
        btn.className = 'btn';
        btn.id = (connDir==='pre') ? 'btn-pre-add-' + d['uname'] : 'btn-post-add-' + d['uname'];
        btn.name = d['uname'];

        if (this.isInWorkspace(d['rid'])){
          btn.innerText = '-';
          btn.className += ' btn-remove btn-danger';
        }else{
          btn.innerText = '+';
          btn.className += ' btn-add btn-success';
        }
        btn.onclick = function(){
          toggleBtn(this);
        };

        c3.appendChild(btn);
        neuron_add = true;
      }
      if(d['has_syn_morph'] && 'syn_uname' in d){
        var btn = document.createElement('button')
        btn.className = 'btn'
        btn.id = (connDir==='pre') ? 'btn-pre-syn-add-' + d['syn_uname'] : 'btn-post-syn-add-' + d['syn_uname'];
        btn.name = d['syn_uname']

        if (this.isInWorkspace(d['syn_rid'])){
          btn.innerText = '-';
          btn.className += ' btn-remove btn-danger';
        }else{
          btn.innerText = '+';
          btn.className += ' btn-add btn-success';
        }
        btn.onclick = function(){
          toggleSynBtn(this);
        };

        c4.appendChild(btn);
        synapse_add = true;
      }

    }
    if (neuron_add){
      $('.neuron_add_'+connDir).show();
    } else{
      $('.neuron_add_'+connDir).hide();
    }

    if (synapse_add){
      $('.synapse_add_'+connDir).show();
    } else{
      $('.synapse_add_'+connDir).hide();
    }

    // refresh list 
    this.updateList();

    // add callback
    $("#presyn-srch").on('keyup change',(function(){  
      this.filterByName(this.preTabId.slice(1),document.getElementById("presyn-srch").value);
    }).bind(this));
    $("#presyn-N").on('keyup change', (function (){
      this.filterByNum(this.preTabId.slice(1),document.getElementById("presyn-N").value);
    }).bind(this));
    $("#postsyn-srch").on('keyup change', (function (){
      this.filterByName(this.postTabId.slice(1),document.getElementById("postsyn-srch").value);
    }).bind(this));
    $("#postsyn-N").on('keyup change', (function (){
      this.filterByNum(this.postTabId.slice(1),document.getElementById("postsyn-N").value);
    }).bind(this));

  }

  ConnTable.prototype.updateList = function(){
    // filter by name and number
    this.filterByName(this.preTabId.slice(1),document.getElementById("presyn-srch").value);
    this.filterByNum(this.preTabId.slice(1),document.getElementById("presyn-N").value);
    this.filterByName(this.postTabId.slice(1),document.getElementById("postsyn-srch").value);
    this.filterByNum(this.postTabId.slice(1),document.getElementById("postsyn-N").value);
  }


  /** <TODO> resolve issue with callback.
  * Add/Remove neuron upon buttonclick in info panel and toggle button
  */
  function toggleBtn(btn){
    if(btn.className.includes('add')){
      // ClientSession.addByUname(btn.name);
      btn.innerText = "-";
      btn.className = "btn btn-remove btn-danger";
    }
    else{
      // ClientSession.removeByUname(btn.name);
      btn.innerText = "+";
      btn.className = "btn btn-add btn-success";
    }
  }

  /**
  * Add/Remove synapse upon buttonclick in info panel and toggle button
  */
  function toggleSynBtn(btn){
    if(btn.className.includes('add')){
      // ClientSession.addSynapseByUname(btn.name);
      btn.innerText = "-";
      btn.className = "btn btn-remove btn-danger";
    } else{
      // ClientSession.removeSynapseByUname(btn.name);
      btn.innerText = "+";
      btn.className = "btn btn-add btn-success";
    }
  }


  /**
  * Pure JS class helpers
  */
  function hasClass(el, className){
    if (el.classList)
      return el.classList.contains(className)
    else
      return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
  }

  /**
  * Pure JS class helpers
  */
  function addClass(el, className){
    if (el.classList)
      el.classList.add(className)
    else if (!hasClass(el, className)) el.className += " " + className
  }

  /**
  * Pure JS class helpers
  */
  function removeClass(el, className){
    if (el.classList)
      el.classList.remove(className)
    else if (hasClass(el, className)){
      var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
      el.className=el.className.replace(reg, ' ')
    }
  }


  /**
  * Dynamic table
  */
  ConnTable.prototype.filterByName = function(tableId, text){
    var filter, table, tr, td, i;
    filter = text.toLowerCase();
    table = document.getElementById(tableId).children[1];
    tr = table.getElementsByTagName("tr");

    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[0];
      if (td) {
        if (td.innerHTML.toLowerCase().indexOf(filter) > -1) {
          removeClass(tr[i],"filtered-name")
          if(!hasClass(tr[i],"filtered-N"))
            tr[i].style.display = "";
        } else {
          addClass(tr[i],"filtered-name")
          tr[i].style.display = "none";
        }
      }
    }
  }

  /**
  * Dynamic table
  */
  ConnTable.prototype.filterByNum = function(tableId,N){
    // Declare variables
    var table, tr, td, i;
    table = document.getElementById(tableId).children[1];
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[1];
      if (td) {
        if (Number(td.innerHTML) > Number(N)) {
          removeClass(tr[i],"filtered-N")
          if(!hasClass(tr[i],"filtered-name"))
            tr[i].style.display = "";
        } else {
          addClass(tr[i],"filtered-N")
          tr[i].style.display = "none";
        }
      }
    }
  }



  /**
   * Expose constructor for SVG
   */
  return ConnTable;
})