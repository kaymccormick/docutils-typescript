/**
 * @rst
 * @class
 * 
 * Runtime setting specification base class.
 * 
 * SettingsSpec subclass objects used by `docutils.frontend.OptionParser`.
 */
import { SettingsSpecType, GenericSettings } from './types';
class SettingsSpec {
    public settingsSpec: SettingsSpecType[] = [];
    public settingsDefaults: GenericSettings = {};
    public settingsDefaultOverrides?: GenericSettings;
    public relativePathSettings: string[] = [];
    public configSection: string = '';
    public configSectionDependencies: string[] = [];
}
/**
 * @uuid 00046f4c-d604-4aae-9e61-d8e77e9609be
 */
export default SettingsSpec;
