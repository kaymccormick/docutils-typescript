/**
 * @rst
 * @class
 *
 * Runtime setting specification base class.
 *
 * SettingsSpec subclass objects used by `docutils.frontend.OptionParser`.
 
 * @uuid 00046f4c-d604-4aae-9e61-d8e77e9609be
*/
class SettingsSpec {
    settingsSpec: {}[] = [];
    settingsDefaults: {};
    settingsDefaultOverrides: {};
    relativePathSettings: {}[] = [];
    configSection: string = "";
    configSectionDependencies: string[] = [];
}

export default SettingsSpec;