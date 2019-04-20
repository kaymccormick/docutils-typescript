const defaultErrorEncodingErrorHandler = 'backslashreplace';

export default {
    tocBacklinks: 'entry',
    footnoteBacklinks: true,
    sectionNumbering: true,
    reportLevel: 2,
    haltLevel: 4,
    exitStatusLevel: 5,
    debug: false,
    traceback: null,
    inputEncodingErrorHandler: 'strict',
    outputEncoding: 'utf-8',
    outputEncodingErrorHandler: 'strict',
    errorEncodingErrorHandler: defaultErrorEncodingErrorHandler,
    errorEncoding: 'utf-8',
    languageCode: 'en',
    recordDependencies: null,
    idPrefix: '',
    autoIdPrefix: 'id',
    dumpSettings: null,
    dumpInternals: null,
    dumpTransforms: null,
    dumpPsuedoXml: null,
    exposeInternalAttribute: null,
    strictVisitor: null,
    warningStream: null,
    // html writer
    mathOutput: 'HTML math.css',
    initialHeaderLevel: 1,
};
