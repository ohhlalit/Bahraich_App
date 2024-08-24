
/**
 * Sorts the data for the provided tab. If data/indices of the respective tab are not provided then sorts the data in place and doesn't return anything.
 * @param {String} name - Name of the tab to be sorted
 * @param {Dictionary} indices - dictionary of the tab to be sorted. If not provided the function will not return anything and implement the sort on the sheet
 * @param {Array} data - Data of the tab to be sorted. If not provided the function will not return anything and implement the sort on the sheet
 * @returns - sorted data in 2D Array if teh data and indices were provided. Otherwise doesn't return anything and sorts the data in the sheet
 */
function sortTab(name, indices, data) {
    let update = 0
    if (indices == undefined || data == undefined) {
        let tabData = getData(name)
        indices = tabData[0]
        data = tabData[3]
        update = 1
    }
    let orderKey = getSortKey_(name, indices)
    data = sortData(data,orderKey)
    if (update == 0)
        return data
    else
        updateDataRows(name,data)   
}

/**
 * Stores all the different sort keys for the tabs and returns them
 * @param {String} name - Name of the tab for which teh sort key is needed
 * @param {Dictionary} indices - Indices of the tab which is to be sorted. If not provided the function can get one
 */
function getSortKey_(name, indices) {
    if (indices == undefined)
        indices = getData(name,1)
    
    let orderKey
    if (name == "FORMULA_ACTIVE")
        orderKey = [{column: indices.route, ascending: true, blanksAtBottom: true},
                    {column: indices.delivery_date, ascending: true, blanksAtBottom: true},
                    {column: indices.id_no, ascending: true, blanksAtBottom: false},
                    {column: indices.twin_id, ascending: true, blanksAtBottom: false}]
    else if (name == "PRIORITY_CALLS_ACTIVE")
        orderKey = [{column: indices.date_to_follow_up, ascending: true, blanksAtBottom: true}]
    else if (name == "OPD_VISITS_ACTIVE")
        orderKey = [{column: indices.expected_opd_date, ascending: true, blanksAtBottom: true}]
    else if (name == "HOME_VISIT_ACTIVE_DBR")
        orderKey = [{column: indices.planned_hv_date, ascending: true, blanksAtBottom: true},
                    {column: indices.visitor, ascending: true, blanksAtBottom: true},
                    {column: indices.order, ascending: true, blanksAtBottom: true},
                    {column: indices.category, ascending: true, blanksAtBottom: true},
                    {column: indices.block, ascending: true, blanksAtBottom: true}]
    
    else if (name == "PROCESS_MONITORING_MASTER")
        orderKey = [{column: indices.intake_date, ascending: true, blanksAtBottom: true}]
    else if (name == "GRAD_SUGGESTIONS")
        orderKey = [{column: indices.grad_status, ascending: true, blanksAtBottom: false}]
    else if(name == "IN_HOSPITAL_TESTING" || name == "IN_HOSPITAL_ARCHIVE_TESTING")
        orderKey = [{column: indices.id_no, ascending: true, blanksAtBottom: true},        
                    {column: indices.date, ascending: true, blanksAtBottom: true}]
    else if (name == "PHONE_HOME_TESTING" || name == "PHONE_HOME_ARCHIVE_TESTING")
        orderKey = [{column: indices.twin_id, ascending: true, blanksAtBottom: true},
                  {column: indices.initial_weight, ascending: true, blanksAtBottom: true},
                  {column: indices.id_no, ascending: true, blanksAtBottom: true},
                  {column: indices.date, ascending: true, blanksAtBottom: true},
                  {column: indices.date_to_follow_up, ascending: true, blanksAtBottom: true}]
    
    else
        throw `No sort key defined for ${name}. Please define the sort key in getSortKey_() function under sortTabs.gs in BahraichApp`
    
    return orderKey
}


/**
 * Sorts the data for the provided tab. If data/indices of the respective tab are not provided then sorts the data in place and doesn't return anything.
 * @param {String} name - Name of the tab to be sorted
 * @param {Dictionary} indices - dictionary of the tab to be sorted. If not provided the function will not return anything and implement the sort on the sheet
 * @param {Array} data - Data of the tab to be sorted. If not provided the function will not return anything and implement the sort on the sheet
 * @returns - sorted data in 2D Array if teh data and indices were provided. Otherwise doesn't return anything and sorts the data in the sheet
 */
function sortTab_advanced(name, indices, data) {
    let update = 0
    if (indices == undefined || data == undefined) {
        let tabData = getData(name)
        indices = tabData[0]
        data = tabData[3]
        update = 1
    }
    let orderKey = getSortKey_(name, indices)
    let maxColumns = getMinAndMaxValuesInDict(indices).maxVal + 1
    if(update) {
        for(let i=0; i<data.length; i++) {
            data[i] = data[i].slice(0,maxColumns) //Need to trim the data because we append intake and basic information to in hospital and phone/home tabs. remove once that is cleaned up
            data[i][maxColumns] = i
        }
    }
    
    
    data = sortData(data,orderKey)
    

    
    if (update == 0)
        return data
    else {
        //Append ordered keys

        maxColumns = data[0].length
        for(let i=0; i<data.length; i++)
            data[i][maxColumns] = i

        
        //Re-sort it on the original order
        data = sortData(data,[{column: maxColumns-1, ascending: true, blanksAtBottom: true}])
        

        //Extract order key
        let sortKey = data.map(x => [x[maxColumns]])

        let tab = getTab_(name)
        const firstRow = eval(name+"_HEADER_INDEX")+2
        const sortCol = indices.sort_key + 1
        tab.getRange(firstRow,sortCol,sortKey.length,1).setValues(sortKey)
    
        //Sort the tab
        const numRows = tab.getLastRow()-firstRow + 1
        const numColumns = tab.getLastColumn() 
        let range = tab.getRange(firstRow,1,numRows,numColumns)
        range.sort([{column:sortCol,ascending:true}])
    }
}

