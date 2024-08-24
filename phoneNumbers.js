//separate functions - as phone numbers are added they should be extracted
//function to separate the phone numbers, that gets called for each id
//add constants for target spreadsheet
function updatePhoneNumbers() {
  let staticData = getData('STATIC')[1]
  
  //get indices 
  let indices = getIndices('PHONE_NUMBERS')

  //empty array to collect rows
  let data = []

  //iterate through ids
  for(const [id, caseData] of Object.entries(staticData)) {
    const phoneNumbers = caseData.phone_numbers
    const phArray = extractPhoneNumbers(phoneNumbers, id, indices)
    data = [...data, ...phArray]
  }

  updateDataRows("PHONE_NUMBERS",data,indices)
}
      
function extractPhoneNumbers(phone, id, indices) {
  
  let phoneNumbers = []
  let matches = phone.match(/(\d{10})(\D*)/) || []
      
  if (matches) {
    let phoneNumber = matches[1];
    let description = matches[2];
  
    if (description == null){
      description = 'Missing';
      // Append extracted data as a row
      phoneNumbers.push({phoneNumber, description});
    }
    else{
      description = description.replace(',', '').replace('(','').replace(')', '').replace('/','').replace('-','').replace('--','').replace(',,', '');
      phoneNumbers.push({phoneNumber, description});
    }
  }

  let match_two = phone.match(/(\d{10})(\D*)(\d{10})(\D*)/)
  if (match_two) {
    let phoneNumber = match_two[3];
    let description = match_two[4].replace(',', '').replace('(','').replace(')', '').replace('/','').replace('-','').replace('--','').replace(',,', '');
    phoneNumbers.push({phoneNumber, description});
  }

  let match_three = phone.match(/(\d{10})(\D*)(\d{10})(\D*)(\d{10})(\D*)/) 
  if (match_three) {
    let phoneNumber = match_three[5];
    let description = match_three[6].replace(',', '').replace('(','').replace(')', '').replace('/','').replace('-','').replace('--','').replace(',,', '');
    phoneNumbers.push({phoneNumber, description});
  }

  let match_four = phone.match(/(\d{10})(\D*)(\d{10})(\D*)(\d{10})(\D*)(\d{10})(\D*)/)
  if (match_four) {
    let phoneNumber = match_four[7];
    let description = match_four[8].replace(',', '').replace('(','').replace(')', '').replace('/','').replace('-','').replace('--','').replace(',,', '');
    phoneNumbers.push({phoneNumber, description});
  }

  let match_five = phone.match(/(\d{10})(\D*)(\d{10})(\D*)(\d{10})(\D*)(\d{10})(\D*)(\d{10})(\D*)/)
  if (match_five) {
    let phoneNumber = match_five[9];
    let description = match_five[10].replace(',', '').replace('(','').replace(')', '').replace('/','').replace('-','').replace('--','').replace(',,', '');
    phoneNumbers.push({phoneNumber, description});
  }

  let phArray = []
  for(let i=0; i<phoneNumbers.length; i++) {
    let row = []
    row[indices.id_no] = id
    row[indices.phone_number] = phoneNumbers[i].phoneNumber
    row[indices.description] = phoneNumbers[i].description
    row[indices.status] = "Active"
    row[indices.preferred] = i == 0 ? 1:0

    phArray.push(row)
  }
  return phArray
}
