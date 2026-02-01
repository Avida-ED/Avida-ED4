var av = av || {};  //incase av already exists
var dojo = dojo || {};

// global definitions based dom that involve DND
// OBSOLETE: all of dnd functions were replaced in dragulaDnd.js

//------------------------------------------------------------------------------------------ av.msg.TestDishSetupPrep --
av.dnd.TestDishSetupPrep = function(fzSection, target, type) {
  //console.log('fzrObject=', av.dnd[fzSection].getSelectedNodes()[0]);
  //need to find selected item. looking for 'dojoDndItem dojoDndItemAnchor' might help
  //console.log('fzOrgan selected keys', Object.keys(av.dnd.fzOrgan.selection)[0]);
  //Object.keys(av.dnd.fzOrgan.selection)[0] and av.dnd.fzOrgan.getSelectedNodes()[0].id return the same thing

  if (undefined != av.dnd[fzSection].getSelectedNodes()[0]) {
    //This section partially puts the test-dish in the active area
    av.msg.setupType = 'test';  //Do not reload files from the active config freezer section
                                      //Do not put data from files in the setup section. 
                                      //
    //there is always a node here, so it must always be cleared when adding a new one.
    av.dnd.activeConfig.selectAll().deleteSelectedNodes();  //http://stackoverflow.com/questions/11909540/how-to-remove-delete-an-item-from-a-dojo-drag-and-drop-source
    av.dnd.activeConfig.sync();   //should be done after insertion or deletion
                                      
    var nodeMvDomid = av.dnd[fzSection].getSelectedNodes()[0].id;
    console.log('fzSection=', fzSection, '; nodeMvDomid=', nodeMvDomid);
    var added = false;
    av.dnd.move.via = 'menu';
    av.dnd.move.source = av.dnd[fzSection];
    av.dnd.move.target = av.dnd[target];
    av.dnd.move.type = type;
    av.dnd.move.sourceDomId = nodeMvDomid;
    av.dnd.move.dir = av.fzr.dir[av.dnd.move.sourceDomId];
    av.dnd.move.nodeName = av.fzr.file[av.dnd.move.dir + '/entryname.txt'];
    av.dnd[target].insertNodes(false, [{data: av.dnd.move.nodeName, type: [type]}]);
    av.dnd[target].sync();
    
    var domIDs = Object.keys(av.dnd[target].map);
    av.dnd.move.targetDomId = domIDs[domIDs.length - 1];
    console.log('move', av.dnd.move);
    added = av.dnd.lndActiveConfig(av.dnd.move, 'av.dnd.TestDishSetupPrep');
    console.log('after added av.dnd.lndActiveConfig, added=', added);
    
    console.log('av.dom.environConfigEdit=',av.dom.environConfigEdit);
    if (av.fzr.file[av.dnd.move.dir+'/'+ 'environment.cfg'] ) {
      av.dom.environConfigEdit.value = av.fzr.file[av.dnd.move.dir+'/'+'environment.cfg'];
    };

  }
  else {
    alert('You must select a test-dish first');
  };
};
//-------------------------------------------------------------------------------------- end av.dnd.testDishSetupPrep --

//------------------------------------------------------------------------------------------------ av.dnd.runTestDish --
av.dnd.runTestDish = function(fzSection, target, type) {
  //console.log('fzrObject=', av.dnd[fzSection].getSelectedNodes()[0]);
  //need to find selected item. looking for 'dojoDndItem dojoDndItemAnchor' might help
  //console.log('fzOrgan selected keys', Object.keys(av.dnd.fzOrgan.selection)[0]);
  //Object.keys(av.dnd.fzOrgan.selection)[0] and av.dnd.fzOrgan.getSelectedNodes()[0].id return the same thing

  if (undefined != av.dnd[fzSection].getSelectedNodes()[0]) {
    //This section partially puts the multi-dish in the active area
    var nodeMvDomid = av.dnd[fzSection].getSelectedNodes()[0].id;
    console.log('fzSection=', fzSection, '; nodeMvDomid=', nodeMvDomid);
    var added = false;
    av.dnd.move.via = 'menu';
    av.dnd.move.source = av.dnd[fzSection];
    av.dnd.move.target = av.dnd[target];
    av.dnd.move.type = type;
    av.dnd.move.sourceDomId = nodeMvDomid;
    av.dnd.move.dir = av.fzr.dir[av.dnd.move.sourceDomId];
    av.dnd.move.nodeName = av.fzr.file[av.dnd.move.dir + '/entryname.txt'];
    av.dnd[target].insertNodes(false, [{data: av.dnd.move.nodeName, type: [type]}]);
    av.dnd[target].sync();
    var domIDs = Object.keys(av.dnd[target].map);
    av.dnd.move.targetDomId = domIDs[domIDs.length - 1];
    console.log('move', av.dnd.move);
    //added = av.dnd.lndActiveConfig(av.dnd.move);

    var filename = av.dnd.move.dir +'/ancestors.txt';
    console.log('filename = ', filename, '=======================================================');
    if (av.fzr.file[filename]) {
      console.log('file ', filename, 'exists');
      av.fio.autoAncestorLoad(av.fzr.file[filename]);
    }
    var filename = av.dnd.move.dir +'/ancestors_manual.txt';
    console.log('filename = ', filename, '=======================================================');
    if (av.fzr.file[filename]) {
      console.log('file ', filename, 'exists');
      av.fio.handAncestorLoad(av.fzr.file[filename]);
    }
    //Now actually load resreq direcdtly from the freezer.
    av.msg.makeTestDirMsg(av.dnd.move.dir);
    av.msg.setupType = 'test';   //Do not reload files from the active config freezer section
  }
  else {
    alert('You must select a multi dish first');
  }
};

//-------------------------------------------------------------------------------------------- end av.dnd.runTestDish --


//----------------------------------------------------------------------------------------------- av.dnd.runTestDish --
av.dnd.runTestDish2 = function(fzSection, target, type) {
  //console.log('fzrObject=', av.dnd[fzSection].getSelectedNodes()[0]);
  //need to find selected item. looking for 'dojoDndItem dojoDndItemAnchor' might help
  //console.log('fzOrgan selected keys', Object.keys(av.dnd.fzOrgan.selection)[0]);
  //Object.keys(av.dnd.fzOrgan.selection)[0] and av.dnd.fzOrgan.getSelectedNodes()[0].id return the same thing

  if (undefined != av.dnd[fzSection].getSelectedNodes()[0]) {
    //This section partially puts the test-dish in the active area
    av.msg.setupType = 'test';   //Do not reload files from the active config freezer section
                                      //Do not put data from files in the setup section. 
    var nodeMvDomid = av.dnd[fzSection].getSelectedNodes()[0].id;
    console.log('fzSection=', fzSection, '; nodeMvDomid=', nodeMvDomid);
    var added = false;
    av.dnd.move.via = 'menu';
    av.dnd.move.source = av.dnd[fzSection];
    av.dnd.move.target = av.dnd[target];
    av.dnd.move.type = type;
    av.dnd.move.sourceDomId = nodeMvDomid;
    av.dnd.move.dir = av.fzr.dir[av.dnd.move.sourceDomId];
    av.dnd.move.nodeName = av.fzr.file[av.dnd.move.dir + '/entryname.txt'];
    av.dnd[target].insertNodes(false, [{data: av.dnd.move.nodeName, type: [type]}]);
    av.dnd[target].sync();
    var domIDs = Object.keys(av.dnd[target].map);
    av.dnd.move.targetDomId = domIDs[domIDs.length - 1];
    console.log('move', av.dnd.move);
    added = av.dnd.lndActiveConfig(av.dnd.move, 'av.dnd.runTestDish2');
    console.log('after added av.dnd.lndActiveConfig, added=', added);
    
    //Now actually load and run the test direcdtly from the freezer.
    av.msg.importTestDishExpr(av.dnd.move.dir); 

    console.log('av.dom.environConfigEdit=',av.dom.environConfigEdit);
    //av.dom.environConfigEdit.value = "some text";
    if (av.fzr.file[av.dnd.move.dir+'/'+ 'environment.cfg'] ) {
      av.dom.environConfigEdit.value = av.fzr.file[av.dnd.move.dir+'/'+'environment.cfg'];
    };

  }
  else {
    alert('You must select a test-dish first');
  };
};


//Add items from freezer section using the menu
//------------------------------------------------------------------------------------------ av.dnd.FzAddExperimentFn --
/* delete soon
av.dnd.FzAddExperiment_Fn_old = function (fzSection, target, type) {
  //console.log('fzrObject=', av.dnd[fzSection].getSelectedNodes()[0]);
  //need to find selected item. looking for 'dojoDndItem dojoDndItemAnchor' might help
  //console.log('fzOrgan selected keys', Object.keys(av.dnd.fzOrgan.selection)[0]);
  //Object.keys(av.dnd.fzOrgan.selection)[0] and av.dnd.fzOrgan.getSelectedNodes()[0].id return the same thing

  if (undefined != av.dnd[fzSection].getSelectedNodes()[0]) {
    var nodeMvDomid = av.dnd[fzSection].getSelectedNodes()[0].id;
    console.log('fzSection=', fzSection, '; target=', target, '; nodeMvDomid=', nodeMvDomid, '; type=', type);
    var addedPopPage = false;
    var addedAnaPage = false;
    av.dnd.move.via = 'menu';
    av.dnd.move.source = av.dnd[fzSection];
    av.dnd.move.target = av.dnd[target];
    av.dnd.move.type = type;
    //av.dnd.move.sourceDomId = Object.keys(av.dnd.move.source.selection)[0];  //does not work here even if same basic thing work in AvidaED.js
    av.dnd.move.sourceDomId = nodeMvDomid;
    av.dnd.move.dir = av.fzr.dir[av.dnd.move.sourceDomId];
    av.dnd.move.nodeName = av.fzr.file[av.dnd.move.dir + '/entryname.txt'];
    av.dnd[target].insertNodes(false, [{data: av.dnd.move.nodeName, type: [type]}]);
    av.dnd[target].sync();
    var domIDs = Object.keys(av.dnd[target].map);
    av.dnd.move.targetDomId = domIDs[domIDs.length - 1];
    av.dnd.move.sourceMoveData = av.dnd.move.source.map[av.dnd.move.sourceDomId];
    console.log('move', av.dnd.move);
    
    if ('fzOrgan' == fzSection && 'ancestorBox' == target) { addedPopPage = av.dnd.lndAncestorBox(av.dnd.move); }
    else if ('fzOrgan' == fzSection && 'activeOrgan' == target) { addedPopPage = av.dnd.lndActiveOrgan(av.dnd.move); }
    else if (('fzConfig' == fzSection || 'fzWorld' == fzSection) && 'activeConfig' == target) { 
      addedPopPage = av.dnd.lndActiveConfig(av.dnd.move, 'av.dnd.FzAddExperimentFn');
    }
    else if ('anlDndChart' == target && 'fzWorld' == fzSection) addedAnaPage = av.dnd.lndAnlDndChart(av.dnd.move);

    if (addedPopPage) av.grd.drawGridSetupFn('av.dnd.FzAddExperimentFn');
    
  }
  else {
    switch(fzSection) {
      case 'fzConfig':
        alert('You must select a configurated dish first');
        break;
      case 'fzOrgan':
        alert('You must select an organism first');
        break;
      case 'fzWorld':
        alert('You must select a populated dish first');
        break;
    }
  }
};
*/
//------------------------------------------------------------------------------------ end av.dnd.FzAddExperimentFn --*/
//
//  general comments
//http://dojo-toolkit.33424.n3.nabble.com/dojo-dnd-problems-selection-object-from-nodes-etc-td3753366.html
//This is supposed to select a node; lists as selected programatically, but does not show up on screen.


//A method to get the data items in a dojo DND container in order
//av.dnd.fzConfig.on('DndDrop', function(source, nodes, copy, target){  //This triggers for every dnd drop, not just those of freezeConfigureNode
//http://stackoverflow.com/questions/5837558/dojo-drag-and-drop-how-to-retrieve-order-of-items
//var orderedDataItems = av.dnd.fzConfig.getAllNodes().map(function(node){
//  return av.dnd.fzConfig.getItem(node.id).data;
//});
//console.log('orderedDataItems', orderedDataItems);
