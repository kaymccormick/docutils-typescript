/**
 * @rst
 * @class
 * 
 * Runtime setting specification base class.
 * 
 * SettingsSpec subclass objects used by `docutils.frontend.OptionParser`.
 */
/**
 * @uuid affb0be9-a282-4a31-b861-ac8a78bdb718
 */
class SettingsSpec {
    settingsSpec: {}[] = [];
    settingsDefaults: {};
    settingsDefaultOverrides: {};
    relativePathSettings: {}[] = [];
    configSection: string = "";
    configSectionDependencies: string[] = [];
}
/**
 * @uuid 00046f4c-d604-4aae-9e61-d8e77e9609be
 */
export default SettingsSpec;
