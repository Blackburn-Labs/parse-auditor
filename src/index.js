const CONFIG_DEFAULTS = {
    classPrefix: '',
    classPostfix: '_AUD',
    fieldPrefix: 'meta_',
    fieldPostfix: '',
    parseSDK: Parse,
};

const audit = async (user, action, subjectClass, subject, config = CONFIG_DEFAULTS) => {
    const Audit = Parse.Object.extend(`${config.classPrefix}${subjectClass}${config.classPostfix}`);
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

    a.save();
};

const init = (auditModifiedClasses, auditAccessClasses = [], options = {}) => {
    const classPrefix = options.classPrefix || CONFIG_DEFAULTS.classPrefix;
    const classPostfix = options.classPostfix || CONFIG_DEFAULTS.classPostfix;
    const fieldPrefix = options.fieldPrefix || CONFIG_DEFAULTS.fieldPrefix;
    const fieldPostfix = options.fieldPostfix || CONFIG_DEFAULTS.fieldPostfix;
    const parseSDK = options.parseSDK || CONFIG_DEFAULTS.parseSDK;
    const config = {
        classPrefix, classPostfix, fieldPrefix, fieldPostfix, parseSDK,
    };

    auditModifiedClasses.forEach((c) => {
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
