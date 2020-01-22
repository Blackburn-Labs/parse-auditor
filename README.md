# Parse Auditor
This is a small module inspired by [Hibernate's Envers](https://hibernate.org/orm/envers/) project. It adds automated data versioning/tracking/auditing to table.

This can be very helpful for apps that need to adhere to regulations like healthcare apps which need to adhere to HIPAA
standards. This can also be used for apps that have a high level of data sensitivity like legal or FinTech apps.

---

## Install
You can use `parse-auditor` anywhere you can use other [cloud code](https://docs.parseplatform.org/cloudcode/guide/) hooks, such as Parse.Cloud.beforeSave(). To get
`parse-auditor` onto your Parse Serve, edit the `cloud/package.json` file: 
```json
{
  "dependencies": {
    "parse-auditor": "*"
  }
}
```
 
---
 
## Usage
Let say you have a healthcare app that needs HIPAA logging around its Patient and Clinic classes. Simply add this to 
your app's cloud code (i.e. `cloud/main.js`):

```javascript
const ParseAuditor = require('./parse-auditor.js');
ParseAuditor(['Patient', 'Clinic'])
```

You usage of `Patient` and `Clinic` goes unchanged, simply write/read form those classes as you normally would. However,
any changes to records in either class will now be automatically versioned and tracked in `Patient_AUD` and `Clinic_AUD`
respectively.

You can also tell `parse-auditor` which classes to track reads on:
```javascript
const ParseAuditor = require('./parse-auditor.js');
ParseAuditor(['Patient', 'Clinic'], ['Patient'])
```

This will not only track all edits to both these classes (creates, updates, deletes) but any views to a `Patient` will
also be tracked. This will all be logged in classes named `Patient_AUD` & `Clinic_AUD` respectively.

---

## Accessing Audit Data
All data for classes that are being audited are stored in *_AUD classes. These classes can be access to query the history
of a record. There are 4 extra fields automatically included with each audit log:
 - meta_actor: The user involved in this event. Either the user who made the update, or the one who viewed this record.
 - meta_action: Will be "SAVE", "DELETE", or "FIND" depending on the action the user took.
 - meta_class: The name of class, convenient when combining complex audit histories across many classes.  
 - meta_subject: The row being edited/viewed. 

So, for exmaple, if you has a Patrient record with ID `EBI363xFOg` you could query the entire edit/view history of that patient
(using the JavaScript Parse SDK):
```javascript
const Patient = Parse.Object.extend("Patient");
const query = new Parse.Query(Patient);
query.equalTo("meta_subject", "EBI363xFOg");
const results = await query.find();
alert("Successfully retrieved " + results.length + " audit records.");
// Do something with the returned Parse.Object values
for (let i = 0; i < results.length; i++) {
  var object = results[i];
  console.log(object.get('meta_actor') + ' - ' + object.get('name'));
}
```

This would output the patient's name over time top the console, so you could see if it changed, and who made the change.  

---

## Configuation

The third argument to `parse-auditor` is a config object. The structure of this object, and its defaults are:
```json
{
    classPrefix: '',
    classPostfix: '_AUD',
    fieldPrefix: 'meta_',
    fieldPostfix: '',
    parseSDK: Parse,
}
```

For example:
```javascript
const ParseAuditor = require('./parse-auditor.js');
ParseAuditor(['Patient', 'Clinic'], ['Patient'], { classPostfix: '_HISTORY' })
```

This will track all edits to these classes (creates, updates, deletes) as well as any views to a `Patient`. This will
all be logged in classes named `Patient_HISTORY` & `Clinic_HISTORY` respectively instead of `Patient_AUD`/`Clinic_AUD`.

## Project Sponsor

This project is sponsored and maintained by [Blackburn Labs](http://www.blackburnlabs.com).
