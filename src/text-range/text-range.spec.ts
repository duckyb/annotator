import { TextPosition, TextRange } from './index';
import { assertNodesEqual } from '../__tests__/utils/compare-dom';

// import { assertNodesEqual } from '../../../test-util/compare-dom';

const html = `
<main>
  <article>
    <p>This is <b>a</b> <i>test paragraph</i>.</p>
    <!-- Comment in middle of HTML -->
    <pre>Some content</pre>
  </article>
</main>
`;

/**
 * Return all the `Text` descendants of `node`
 *
 * @param {Node} node
 * @return {Text[]}
 */
function textNodes(node: Node): Text[] {
  const nodes: Text[] = [];
  const iter = document.createNodeIterator(node, NodeFilter.SHOW_TEXT);
  let current: Node | null;
  while ((current = iter.nextNode())) {
    nodes.push(current as Text);
  }
  return nodes;
}

describe('annotator/anchoring/text-range', () => {
  describe('TextPosition', () => {
    let container: HTMLDivElement;
    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = html;
    });

    afterEach(() => {
      container.remove();
    });

    describe('#constructor', () => {
      it('throws if offset is negative', () => {
        expect(() => {
          new TextPosition(container, -1);
        }).toThrow('Offset is invalid');
      });
    });

    describe('#resolve', () => {
      it('resolves text position at start of element to correct node and offset', () => {
        const pos = new TextPosition(container, 0);

        const { node, offset } = pos.resolve();

        expect(node).toEqualNode(textNodes(container)[0]);
        expect(offset).toEqual(0);
      });

      it('resolves text position in middle of element to correct node and offset', () => {
        const containerText = container.textContent || '';
        const pos = new TextPosition(container, containerText.indexOf('is a'));

        const { node, offset } = pos.resolve();

        const pElement = container.querySelector('p');
        expect(pElement).toBeTruthy();
        const firstChild = pElement?.firstChild;
        expect(firstChild).toBeTruthy();

        expect(node).toEqualNode(firstChild!);
        expect(offset).toEqual('This '.length);
      });

      it('resolves text position at end of element to correct node and offset', () => {
        const containerText = container.textContent || '';
        const pos = new TextPosition(container, containerText.length);

        const { node, offset } = pos.resolve();

        const lastTextNode = textNodes(container).slice(-1)[0];
        expect(node).toEqualNode(lastTextNode);
        expect(offset).toEqual(lastTextNode.data.length);
      });

      it('ignores text in comments and processing instructions', () => {
        const el = document.createElement('div');
        const text = document.createTextNode('some text');
        const comment = document.createComment('some comment');
        const piNode = document.createProcessingInstruction('foo', 'bar');
        el.append(comment, piNode, text);

        const pos = new TextPosition(el, 3);
        const resolved = pos.resolve();

        expect(resolved.node).toBe(text);
        expect(resolved.offset).toBe(3);
      });

      it('throws if offset exceeds current text content length', () => {
        const containerText = container.textContent || '';
        const pos = new TextPosition(container, containerText.length + 1);

        expect(() => {
          pos.resolve();
        }).toThrowError('Offset exceeds text length');
      });
    });

    describe('#relativeTo', () => {
      it("throws an error if argument is not an ancestor of position's element", () => {
        const el = document.createElement('div');
        el.append('One');
        const firstChild = el.firstChild;
        expect(firstChild).toBeTruthy();
        const pos = TextPosition.fromPoint(firstChild!, 0);

        expect(() => {
          pos.relativeTo(document.body);
        }).toThrow('Parent is not an ancestor of current element');
      });

      it('returns a TextPosition with offset relative to the given parent', () => {
        const grandparent = document.createElement('div');
        const parent = document.createElement('div');
        const child = document.createElement('span');

        grandparent.append('a', parent);
        parent.append('bc', child);
        child.append('def');

        const firstChild = child.firstChild;
        expect(firstChild).toBeTruthy();
        const childPos = TextPosition.fromPoint(firstChild!, 3);

        const parentPos = childPos.relativeTo(parent);
        expect(parentPos.element).toEqual(parent);
        expect(parentPos.offset).toEqual(5);

        const grandparentPos = childPos.relativeTo(grandparent);
        expect(grandparentPos.element).toEqual(grandparent);
        expect(grandparentPos.offset).toEqual(6);
      });

      it('ignores text in comments and processing instructions', () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        const comment = document.createComment('foobar');
        const piNode = document.createProcessingInstruction('one', 'two');
        child.append('def');
        parent.append(comment, piNode, child);

        const firstChild = child.firstChild;
        expect(firstChild).toBeTruthy();
        const childPos = TextPosition.fromPoint(firstChild!, 3);
        const parentPos = childPos.relativeTo(parent);

        expect(parentPos.element).toEqual(parent);
        expect(parentPos.offset).toEqual(3);
      });
    });

    describe('fromPoint', () => {
      it('returns TextPosition for offset in Text node', () => {
        const el = document.createElement('div');
        el.append('One', 'two', 'three');

        const pos = TextPosition.fromPoint(el.childNodes[1], 0);

        assertNodesEqual(pos.element, el);
        const elText = el.textContent || '';
        expect(pos.offset).toBe(elText.indexOf('two'));
      });

      it('returns TextPosition for offset in Element node', () => {
        const el = document.createElement('div');
        el.innerHTML = '<b>foo</b><i>bar</i><u>baz</u>';

        const pos = TextPosition.fromPoint(el, 1);

        assertNodesEqual(pos.element, el);
        const elText = el.textContent || '';
        expect(pos.offset).toBe(elText.indexOf('bar'));
      });

      it('ignores text in comments and processing instructions', () => {
        const el = document.createElement('div');
        const comment = document.createComment('ignore me');
        const piNode = document.createProcessingInstruction('one', 'two');
        el.append(comment, piNode, 'foobar');

        const pos = TextPosition.fromPoint(el.childNodes[2], 3);

        expect(pos.element).toEqual(el);
        expect(pos.offset).toEqual(3);
      });

      it('throws if node is not a Text or Element', () => {
        expect(() => {
          TextPosition.fromPoint(document, 0);
        }).toThrow('Point is not in an element or text node');
      });

      it('throws if Text node has no parent', () => {
        expect(() => {
          TextPosition.fromPoint(document.createTextNode('foo'), 0);
        }).toThrow('Text node has no parent');
      });

      it('throws if node is a Text node and offset is invalid', () => {
        const testContainer = document.createElement('div');
        testContainer.textContent = 'This is a test';
        expect(() => {
          const firstChild = testContainer.firstChild;
          expect(firstChild).toBeTruthy();
          TextPosition.fromPoint(firstChild!, 100);
        }).toThrow('Text node offset is out of range');
      });

      it('throws if Node is an Element node and offset is invalid', () => {
        const testContainer = document.createElement('div');
        const child = document.createElement('span');
        testContainer.appendChild(child);
        expect(() => {
          TextPosition.fromPoint(testContainer, 2);
        }).toThrow('Child node offset is out of range');
      });
    });
  });

  describe('TextRange', () => {
    describe('#toRange', () => {
      it('resolves start and end points in same element', () => {
        const el = document.createElement('div');
        el.textContent = 'one two three';

        const textRange = new TextRange(
          new TextPosition(el, 4),
          new TextPosition(el, 7)
        );
        const range = textRange.toRange();

        expect(range.toString()).toEqual('two');
      });

      it('resolves start and end points in same element but different text nodes', () => {
        const el = document.createElement('div');
        el.append('one', 'two', 'three');

        const textRange = new TextRange(
          new TextPosition(el, 0),
          new TextPosition(el, (el.textContent || '').length)
        );
        const range = textRange.toRange();

        expect(range.toString()).toEqual(el.textContent);
      });

      it('resolves start and end points in same element with start > end', () => {
        const el = document.createElement('div');
        el.textContent = 'one two three';

        const textRange = new TextRange(
          new TextPosition(el, 7),
          new TextPosition(el, 4)
        );
        const range = textRange.toRange();

        expect(range.startContainer).toEqual(el.firstChild);
        expect(range.startOffset).toEqual(4);
        expect(range.collapsed).toBeTruthy();
      });

      it('resolves start and end points in different elements', () => {
        const parent = document.createElement('div');
        const firstChild = document.createElement('span');
        firstChild.append('foo');
        const secondChild = document.createElement('span');
        secondChild.append('bar');
        parent.append(firstChild, secondChild);

        const textRange = new TextRange(
          new TextPosition(firstChild, 0),
          new TextPosition(secondChild, 3)
        );
        const range = textRange.toRange();

        expect(range.toString()).toEqual('foobar');
      });

      it('throws if start point cannot be resolved', () => {
        const el = document.createElement('div');
        el.textContent = 'one two three';

        const textRange = new TextRange(
          new TextPosition(el, 100),
          new TextPosition(el, 5)
        );

        expect(() => {
          textRange.toRange();
        }).toThrow('Offset exceeds text length');
      });

      it('throws if end point cannot be resolved', () => {
        const el = document.createElement('div');
        el.textContent = 'one two three';

        const textRange = new TextRange(
          new TextPosition(el, 5),
          new TextPosition(el, 100)
        );

        expect(() => {
          textRange.toRange();
        }).toThrow('Offset exceeds text length');
      });
    });

    describe('fromRange', () => {
      it('sets `start` and `end` points of range', () => {
        const el = document.createElement('div');
        el.textContent = 'one two three';

        const range = new Range();
        range.selectNodeContents(el);

        const textRange = TextRange.fromRange(range);

        expect(textRange.start.element).toEqual(el);
        expect(textRange.start.offset).toEqual(0);
        expect(textRange.end.element).toEqual(el);
        expect(textRange.end.offset).toEqual(el.textContent.length);
      });

      it('throws if start or end points cannot be converted to a position', () => {
        const range = new Range();
        expect(() => {
          TextRange.fromRange(range);
        }).toThrow('Point is not in an element or text node');
      });
    });
  });
});
