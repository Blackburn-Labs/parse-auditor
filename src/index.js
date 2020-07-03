const CONFIG_DEFAULTS = {
    classPrefix: '',
    classPostfix: '_AUD',
    fieldPrefix: 'meta_',
    fieldPostfix: '',
    parseSDK: Parse,
    useMasterKey: false,
    clp: {}
};

const fixClassNameIfNeeded = (subjectClass, config = CONFIG_DEFAULTS) =>{
    if ((config.classPrefix === '') && (subjectClass.charAt(0) === '_')){
        subjectClass = subjectClass.substring(1, subjectClass.length);;
    }
    return `${config.classPrefix}${subjectClass}${config.classPostfix}`;
}

const setCLP = async (subjectClass, config = CONFIG_DEFAULTS) => {
    const fixedClassName = fixClassNameIfNeeded(subjectClass,config);
    const a = new Parse.Schema(fixedClassName);

    await a.get()
    .catch(() => {
        a.setCLP(config.clp)
        .save({useMasterKey: config.useMasterKey})
        .then(() => {
            console.log(`parse-auditor successfully created class '${fixedClassName}'. Ignore any previous errors about this class`);
        });
    })
};

const audit = async (user, action, subjectClass, subject, config = CONFIG_DEFAULTS) => {
    const Audit = Parse.Object.extend(fixClassNameIfNeeded(subjectClass,config));
    const a = new Audit();

    for (const property in subject.attributes) {
        if (Object.prototype.hasOwnProperty.call(subject.attributes, property)) {
            a.set(property, subject.attributes[property]);
        }
    }

    a.set(`${config.fieldPrefix}actor${config.fieldPostfix}`, user);
    a.set(`${config.fieldPrefix}action${config.fieldPostfix}`, action);
    a.set(`${config.fieldPrefix}class${config.fieldPostfix}`, subjectClass);
    a.set(`${config.fieldPrefix}subject${config.fieldPostfix}`, subject);
    a.save({useMasterKey: config.useMasterKey});
};

const init = (auditModifiedClasses, auditAccessClasses = [], options = {}) => {
    const classPrefix = options.classPrefix || CONFIG_DEFAULTS.classPrefix;
    const classPostfix = options.classPostfix || CONFIG_DEFAULTS.classPostfix;
    const fieldPrefix = options.fieldPrefix || CONFIG_DEFAULTS.fieldPrefix;
    const fieldPostfix = options.fieldPostfix || CONFIG_DEFAULTS.fieldPostfix;
    const parseSDK = options.parseSDK || CONFIG_DEFAULTS.parseSDK;
    const useMasterKey = options.useMasterKey || CONFIG_DEFAULTS.useMasterKey;
    const clp = options.clp || CONFIG_DEFAULTS.clp;
    const config = {
        classPrefix, classPostfix, fieldPrefix, fieldPostfix, parseSDK, useMasterKey, clp
    };

    auditModifiedClasses.forEach((c) => {
        if (Object.keys(config.clp).length !== 0){
            parseSDK.Cloud.define(`audit${config.classPrefix}${c}${config.classPostfix}SetCLP`, async req =>  setCLP(c, config));
            parseSDK.Cloud.run(`audit${config.classPrefix}${c}${config.classPostfix}SetCLP`);
        }
        parseSDK.Cloud.afterSave(c, async req => audit(req.user, 'SAVE', c, req.object, config));
        parseSDK.Cloud.afterDelete(c, async req => audit(req.user, 'DELETE', c, req.object, config));
    });

    auditAccessClasses.forEach((c) => {
        parseSDK.Cloud.afterFind(c, async (req) => {
            req.objects.forEach(async object => audit(req.user, 'FIND', c, object, config));
            return req.objects;
        });
    });
};

const parseAuditor = module.exports = init;
parseAuditor.init = init;
parseAuditor.audit = audit;
parseAuditor.CONFIG_DEFAULTS = CONFIG_DEFAULTS;
