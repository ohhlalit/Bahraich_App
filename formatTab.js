
function formatTab(tabName) {
  let indices = getData(tabName,1)
  let tab = getTab_(tabName)
  const startRow = eval(tabName + "_HEADER_INDEX") + 2 //Add one to get to the first row of data and another 1 to convert index to row (index starts at 0, row at 1)
  const lastRow = tab.getLastRow()
  const numRows = lastRow - startRow + 1
  let colNames = Object.keys(indices)
  for(let i=0; i<colNames.length; i++) {
    const colName = colNames[i]
    const colRow = indices[colName]+1
    const format = formatDict[colName] || "General"
    tab.getRange(startRow,colRow,numRows,1).setNumberFormat(format) //It turns out this is much faster than the setNumberFormats fn becauser apparently it does cell by cell formatting
    console.log(`Formatted: ${colName} as ${format}`)
  }
  console.log("Finished formatting")
}


const formatDict = {
                    id_no: "#0.##",
                    ca: "#0.##",
                    ga: "#0.##",
                    initial_weight: "#0.##",
                    weight: "#0.##",
                    twin_id: "#0.##",
                    temp: "#0.##",
                    if_bftotal_times: "#0.##",
                    ml_fed_while_bf: "#0.##",
                    if_ebmtotal_ml_expressed: "#0.##",
                    if_ebm_total_ml_consumed: "#0.##",
                    if_ebm_required_ml: "#0.##",
                    total_hours_kmc: "#0.##",
                    mother_age: "#0.##",
                    living_girls: "#0.##",
                    living_boys: "#0.##",
                    miscarriage: "#0.##",
                    sb: "#0.##",
                    nnm: "#0.##",
                    child_deaths: "#0.##",
                    sepsis_indications_yes: "#0.##",
                    sepsis_indications_no: "#0.##",
                    sepsis_indications_dont_know: "#0.##",
                    ba_total: "#0.##",
                    ift_total: "#0.##",
                    total_consumed: "#0.##",
                    ml_expressed: "#0.##",
                    cup_total: "#0.##",
                    date_to_follow_up: 'dd"-"mmm',
                    birthday: 'dd"-"mmm',
                    date: 'dd"-"mmm',
                    date_baby_reached_44w:'dd"-"mmm',
                    last_data_entry_date: 'dd"-"mmm' ,
                    intake_date: 'dd"-"mmm' ,
                    weight_date_40W: 'dd"-"mmm' ,
                    weight_date_44W: 'dd"-"mmm' ,
                    grad_date:  'dd"-"mmm' ,
                    last_weight_date: 'dd"-"mmm' ,
                    refusal_last_date: 'dd"-"mmm' ,
                    unreachable_last_date: 'dd"-"mmm' ,
                    do_not_follow_last_date: 'dd"-"mmm' ,
                    death_date:'dd"-"mmm' ,
                    expected_opd_date: 'dd"-"mmm' ,
                    date_raised:  'dd"-"mmm' ,
                    last_date_staff_reviewed: 'dd"-"mmm' ,
                    date_visit_is_needed_pd: 'dd"-"mmm',
                    last_weight_date:'dd"-"mmm',
                    gmkgday_between_birth_and_4_weeks_ca:"#0" ,
                    gmday_between_0_and_4_weeks_ca:"#0" ,
                    if_bf_min_per_feed : "#0.##",
                    if_bf_feeds_per_24_hr : "#0.##",
                    ml_mother_reports_per_feed: "#0.##",
                    no_of_feeds_mother_reports_per_24h: "#0.##",
                    ml_required_for_one_feed_based_on_weight: "#0.##",
                    last_hv_date: 'dd"-"mmm',
                    planned_hv_date: 'dd"-"mmm',
                    start_date :'dd"-"mmm',
                    end_date :'dd"-"mmm'

                  }


