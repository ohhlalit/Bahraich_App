function exitBaby() {
    //get the data we need
    let [indices, data] = BahraichApp.getData('IN_HOSPITAL')
    let [deadIn_indices, deadIn_data] = BahraichApp.getData('DIED_IN_ASMC')
    let [deadOut_indices, deadOut_data] = BahraichApp.getData('DIED_OUT_ASMC')
  
    let in_hospital_ids = Object.keys(data) 
    let deadIn_ids = Object.keys(deadIn_data)
    let deadOut_ids = Object.keys(deadOut_data)
    var targetSpreadsheet = SpreadsheetApp.openById("1pG7ubJoHIqVR2gWgtRG2QvnAUcS-e4F5sglxWII8Kgo");
    var targetSheet = targetSpreadsheet.getSheetByName('modified');
  
    targetSheet.appendRow(['ID', 'Mother', 'Father', "type of form", "baby location"])
  
    //Iterate through IDs
    for (let i = 0; i < in_hospital_ids.length; i++) {
      let id = in_hospital_ids[i];
      let caseData = data[id].case_history;
  
      // Check if the ID has an exit row
      let hasExit = false;
  
      for (let k = 0; k < caseData.length; k++) {
        let exitRow = caseData[k];
        let exitType = exitRow[indices.type_of_form];
        let babyloc = exitRow[indices.where_is_the_baby_now]
  
        if (exitType.toLowerCase().includes('exit') || exitType.toLowerCase().includes('discharge') || exitType.toLowerCase().includes('abscond') || exitType.toLowerCase().includes('lama') || (typeof babyloc == 'string' && babyloc.toLowerCase().includes('exit')) || (typeof babyloc == 'string' && babyloc.toLowerCase().includes('discharge')) || (typeof babyloc == 'string' && babyloc.toLowerCase().includes('abscond')) || (typeof babyloc == 'string' && babyloc.toLowerCase().includes('lama'))){
          hasExit = true;
          break; //exit loop if there is an exit
        }
      }
      // see if the ids in hospital sheet are in any of the outcome sheets (check the keys)
      if (!deadIn_ids.includes(id) && !deadOut_ids.includes(id)){
  
        //if they are not then check if the id does not have an exit row
        if (!hasExit) {
          // we want to store mothers name, fathers name, and location, and type of form
          let mother = data[id].mother
          let father = data[id].father
          let babyNow = data[id].where_is_the_baby_now
          let typ = data[id].type_of_form
  
          let dt = data[id].date
          var td=new Date().valueOf(); // todays date
          var sec=1000;
          var min=60*sec;
          var hour=60*min;
          var day=24*hour;
          var diff=td-dt.valueOf(); //difference 
          var days=Math.floor(diff/day); 
  
          //if no exit row, see if theres been an entry in the last 3 days
          if(days >= 3){
            //if there hasnt been, add it to the new list
            targetSheet.appendRow([id, mother, father, typ, babyNow]);
          }
        }
      }
    }

  }
  