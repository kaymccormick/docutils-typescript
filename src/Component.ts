/**
 * @uuid d399ca76-1898-4d75-9b42-b73180707244
 */
import TransformSpec from './TransformSpec';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
const __docformat__ = "reStructuredText";

/**
 * Base class for docutils components.
 * @extends TransformSpec
 *  
 * @uuid a3d83bd3-67ad-4af3-8167-34d049f1c67c
 */
class Component extends TransformSpec {
    supported: string[] = [];
    componentType: string = "random";

    public toString(): string {
        return `Component<${this.constructor.name}>`;
    }
}

export default Component;