function updateLog(id, oldData, newData) {

  let update_indices = getIndices('UPDATE_LOG')

  let rowsToInsert = []
  let user = Session.getActiveUser().getEmail().split("@")[0] //Extract the username instead of the whole email address. Avoid repeated API calls
  let dt = new Date(); //Avoid repeated object creation (there can also be in theory a marginal difference in time when the loop is running. All the updates within the same update should have the same time stamp)

  let keys = Object.keys(newData)
  for(let i=0; i<keys.length; i++) { //I have switched this to a simple for loop. Nothing wrong with what you wrote, just a personal preference to make things consistent in the codebase
      
      let key = keys[i]

      let newRow = [];
      newRow[update_indices.id_no] = id
      newRow[update_indices.timestamp] = dt
      newRow[update_indices.user] = user
      newRow[update_indices.fields_updated] = key
      newRow[update_indices.new_values] = newData[key];
      newRow[update_indices.old_values] = oldData[key];
      rowsToInsert.push(newRow)
  }
  insertData('UPDATE_LOG', -1, rowsToInsert);
}

