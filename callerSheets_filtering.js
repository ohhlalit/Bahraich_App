
function cs_getPending(dataArray, submittedCases, filterDate) {
  
  /*Impose conditons below
  1. Not Present in Submitted Ids and if present the call status is 'Incorrect Baby'
  2. Follow-up date less than filterDate's date
  3. Phone Type doesn't include Special Call and if it does it should also include '=> Phone'. This signifies that the transition from special call has been made to phone
  4. Doesn't contain xit, but if it does it should contain Call..therefore it doesn't allow any other exit status other than Exit Call.../exit call...
  5. Doesn't include the "hospital" type.
  */
  
  let filteredData = dataArray.filter(element =>
      (Object.keys(submittedCases).indexOf(String(element.id_no)) == -1 || submittedCases[String(element.id_no)].result_of_call == 'Incorrect Baby') &&
      element.date_to_follow_up <= filterDate && element.date_to_follow_up != "" &&
      (!element.type.includes('Special Call') || element.type.includes('=> Phone')) &&
      (!element.type.includes('xit') || element.type.includes('Call')) && (!element.type.includes("reIntake")));
  
  console.log("Filtered Data Computed")
  filteredData.sort(sortByPriority)
  return filteredData 

}


function cs_getDoneForToday(dataArray, submittedCases, filterDate) {
  /* Impose conditions below:
  1. Present in Submitted Ids
  2. Follow-up date less than filterDate's date
  3. Phone Type doesn't include Special Call, or if it does, it should also include '=> Phone'. This signifies that the transition from special call has been made to phone.
  4. Submit status doesn't contain 'No Answer', 'Not Connecting', 'No Incoming', or 'Incomplete'.
  */

  let filteredData = dataArray.filter(element =>
    Object.keys(submittedCases).indexOf(String(element.id_no)) > -1 &&
    (!element.type.includes('Special Call') || element.type.includes('=> Phone')) &&
    element.date_to_follow_up <= filterDate && element.date_to_follow_up != ""
  )

  filteredData = filteredData.filter(element => {
    const submittedStatus = submittedCases[String(element.id_no)].result_of_call
    return (
      !submittedStatus.includes('Incorrect Baby') &&
      !submittedStatus.includes('No Answer') &&
      !submittedStatus.includes('Not Connecting') &&
      !submittedStatus.includes('No Incoming') &&
      !submittedStatus.includes('Incomplete') &&
      !submittedStatus.includes('Switched Off')
    )
  })

  return filteredData
}


function cs_getCallBackNoData(dataArray, submittedCases, filterDate) {
  /* Impose conditions below:
  1. Present in Submitted Ids
  2. Follow-up date less than filterDate's date
  3. Phone Type doesn't include Special Call, or if it does, it should also include '=> Phone'. This signifies that the transition from special call has been made to phone.
  4. Submit status contains either 'No Answer', 'Not Connecting', or 'No Incoming'.
  */

  let filteredData = dataArray.filter(element =>
    Object.keys(submittedCases).indexOf(String(element.id_no)) > -1 &&
    (!element.type.includes('Special Call') || element.type.includes('=> Phone')) &&
    element.date_to_follow_up <= filterDate && element.date_to_follow_up != ""
  );

  filteredData = filteredData.filter(element => {
    const submittedStatus = submittedCases[String(element.id_no)].result_of_call
    return (
      submittedStatus.includes('No Answer') ||
      submittedStatus.includes('Not Connecting') ||
      submittedStatus.includes('No Incoming') ||
      submittedStatus.includes('Switched Off')
    )
  })

  return filteredData
}



function cs_getCallBackIncomplete(dataArray, submittedCases, filterDate) {
  /* Impose conditions below:
  1. Present in Submitted Ids
  2. Follow-up date less than filterDate's date
  3. Phone Type doesn't include Special Call, or if it does, it should also include '=> Phone'. This signifies that the transition from special call has been made to phone.
  4. Submit status contains 'Incomplete'.
  */

  let filteredData = dataArray.filter(element =>
    (Object.keys(submittedCases).indexOf(String(element.id_no)) > -1) &&
    (!element.type.includes('Special Call') || element.type.includes('=> Phone')) &&
    (element.date_to_follow_up <= filterDate) && (element.date_to_follow_up !== "")
  )

  filteredData = filteredData.filter(element => {
    const submittedStatus = submittedCases[String(element.id_no)].result_of_call
    return submittedStatus.includes('Incomplete')
  })

  return filteredData
}



function cs_getExitCalls(dataArray, submittedCases, filterDate) {
  /* Impose conditions below:
  1. Not present in Submitted Ids
  2. Follow-up date less than filterDate's date
  3. Phone Type doesn't include Special Call, or if it does, it should also include '=> Phone'. This signifies that the transition from special call has been made to phone.
  4. Does contain 'xit', but does not also contain 'Call'. This allows all exit statuses other than 'Exit Call' and 'exit call'.
  */

  let filteredData = dataArray.filter(element =>
    (Object.keys(submittedCases).indexOf(String(element.id_no)) === -1) &&
    (element.date_to_follow_up <= filterDate) && (element.date_to_follow_up !== "") &&
    (!element.type.includes('Special Call') || element.type.includes('=> Phone')) &&
    (element.type.includes('xit') && !element.type.includes('Call')) 
  )

  return filteredData
}



function cs_getSpecialCalls(dataArray, submittedCases, filterDate) {
  /* Impose conditions below:
  1. Not present in Submitted Ids
  2. Follow-up date less than filterDate's date
  3. Phone Type includes Special Call but does not include '=> Phone'. This signifies that the transition from special call has been made to phone.
  4. Does not contain 'xit' or contains 'Call'. This allows all statuses other than exit statuses.
  */

  let filteredData = dataArray.filter(element =>
    (Object.keys(submittedCases).indexOf(String(element.id_no)) === -1) &&
    (element.date_to_follow_up <= filterDate) && (element.date_to_follow_up !== "") &&
    (element.type.includes('Special Call') && !element.type.includes('=> Phone')) &&
    (!element.type.includes('xit') || element.type.includes('Call'))
  )

  return filteredData
}


function cs_getSpecialDoneForfilterDate(dataArray, submittedCases, filterDate) {
  /* Impose conditions below:
  1. Present in Submitted Ids
  2. Follow-up date less than filterDate's date
  3. Phone Type includes Special Call but does not include '=> Phone'. This signifies that the transition from special call has been made to phone.
  4. Submit status doesn't contain 'No Answer', 'Not Connecting', 'No Incoming', or 'Incomplete'.
  */

  let filteredData = dataArray.filter(element =>
    Object.keys(submittedCases).indexOf(String(element.id_no)) > -1 &&
    element.type.includes('Special Call') && !element.type.includes('=> Phone') &&
    element.date_to_follow_up <= filterDate && element.date_to_follow_up !== ""
  );

  filteredData = filteredData.filter(element => {
    const submittedStatus = submittedCases[String(element.id_no)].result_of_call
    return (
      !submittedStatus.includes('No Answer') &&
      !submittedStatus.includes('Not Connecting') &&
      !submittedStatus.includes('No Incoming') &&
      !submittedStatus.includes('Incomplete')
    )
  })

  return filteredData
}


function cs_getSpecialCallBackNoData(dataArray, submittedCases, filterDate) {
  /* Impose conditions below:
  1. Present in Submitted Ids
  2. Follow-up date less than filterDate's date
  3. Phone Type includes Special Call but does not include '=> Phone'. This signifies that the transition from special call has been made to phone.
  4. Submit status contains either 'No Answer', 'Not Connecting', or 'No Incoming'.
  */

  let filteredData = dataArray.filter(element =>
    Object.keys(submittedCases).indexOf(String(element.id_no)) > -1 &&
    element.type.includes('Special Call') && !element.type.includes('=> Phone') &&
    element.date_to_follow_up <= filterDate && element.date_to_follow_up !== ""
  )

  filteredData = filteredData.filter(element => {
    const submittedStatus = submittedCases[String(element.id_no)].result_of_call
    return (
      submittedStatus.includes('No Answer') ||
      submittedStatus.includes('Not Connecting') ||
      submittedStatus.includes('No Incoming')
    )
  })

  return filteredData
}


function cs_getSpecialCallBackIncomplete(dataArray, submittedCases, filterDate) {
  /* Impose conditions below:
  1. Present in Submitted Ids
  2. Follow-up date less than filterDate's date
  3. Phone Type includes Special Call but does not include '=> Phone'. This signifies that the transition from special call has been made to phone.
  4. Submit status contains 'Incomplete'.
  */

  let filteredData = dataArray.filter(element =>
    Object.keys(submittedCases).indexOf(String(element.id_no)) > -1 &&
    element.type.includes('Special Call') && !element.type.includes('=> Phone') &&
    element.date_to_follow_up <= filterDate && element.date_to_follow_up !== ""
  );

  filteredData = filteredData.filter(element => {
    const submittedStatus = submittedCases[String(element.id_no)].result_of_call
    return submittedStatus.includes('Incomplete')
  })

  return filteredData
}


function calculateDaysDifference(caseData) {
  const filterDate = new Date(); // Set your desired filter date
  const followUpDate = new Date(caseData.date_to_follow_up);
  const dayDifference = Math.floor((followUpDate - filterDate) / (24 * 60 * 60 * 1000));
  return dayDifference;
}

function sortByPriority(case1, case2) {
  // Check if either case is on a special call
  const isSpecialCall1 = case1.type.includes('Special Call')
  const isSpecialCall2 = case2.type.includes('Special Call')

  // Sort babies not on special calls first
  if (!isSpecialCall1 && isSpecialCall2) {
    return -1;
  } else if (isSpecialCall1 && !isSpecialCall2) {
    return 1;
  } else {
    // For babies not on special calls, sort by date_to_follow_up and initial_weight
    if (!isSpecialCall1 && !isSpecialCall2) {
      case1.daysDifference = Math.abs(calculateDaysDifference(case1))
      case2.daysDifference = Math.abs(calculateDaysDifference(case2))

      // Sort by daysDifference in ascending order
      const dayDifferenceComparison = case1.daysDifference - case2.daysDifference;

      if (dayDifferenceComparison !== 0) {
        return dayDifferenceComparison;
      } else {
        // If day differences are the same, sort by initial weights in ascending order
        return case1.initial_weight - case2.initial_weight;
      }
    } else if(isSpecialCall1 && isSpecialCall2) {
      case1.daysDifference = Math.abs(calculateDaysDifference(case1))
      case2.daysDifference = Math.abs(calculateDaysDifference(case2))

      // Sort by daysDifference in ascending order
      const dayDifferenceComparison = case1.daysDifference - case2.daysDifference;

      if (dayDifferenceComparison !== 0) {
        return dayDifferenceComparison;
      } else {
        // If day differences are the same, sort by initial weights in ascending order
        return case1.initial_weight - case2.initial_weight;
      }
    }
  }
}
