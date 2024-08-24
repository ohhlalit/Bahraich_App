
function populatePhoneHomeView() {
    let [indices,,,data] = getData("PHONE_HOME_TESTING")
    sidebar_addGACAinWDFormat_(data,indices)
    let sortKey = getSortKey_("PHONE_HOME_TESTING", indices)
    sortData(data,sortKey)
    
    
    
    updateDataRows("DBR_PHONE_HOME_VIEW",data,indices,1)
}