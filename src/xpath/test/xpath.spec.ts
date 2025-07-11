import { nodeFromXPath } from '../index';

describe('annotator/anchoring/xpath', () => {
  describe('nodeFromXPath', () => {
    let container: HTMLDivElement;
    const html = `
        <h1 id="h1-1">text</h1>
        <p id="p-1">text<br/><br/><a id="a-1">text</a></p>
        <p id="p-2">text<br/><em id="em-1"><br/>text</em>text</p>
        <span>
          <ul>
            <li id="li-1">text 1</li>
            <li id="li-2">text 2</li>
            <li id="li-3">text 3</li>
            <custom-element>text 4</custom-element>
          </ul>
          <math xmlns="http://www.w3.org/1998/Math/MathML">
            <msqrt><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></msqrt>
          </math>
          <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
            <text x="20" y="35">Hello</text>
            <text x="40" y="35">world</text>
          </svg>
        </span>`;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.prepend(container);

      container.innerHTML = html;

      jest.spyOn(document, 'evaluate');
    });

    afterEach(() => {
      jest.restoreAllMocks();
      container.remove();
    });

    [
      // Single element path
      {
        xpath: '/h1[1]',
        nodeName: 'H1',
      },
      // Multi-element path
      {
        xpath: '/p[1]/a[1]',
        nodeName: 'A',
      },
      {
        xpath: '/span[1]/ul[1]/li[2]',
        nodeName: 'LI',
      },
      // Upper-case element names
      {
        xpath: '/SPAN[1]/UL[1]/LI[2]',
        nodeName: 'LI',
      },
      // Element path with implicit `[1]` index
      {
        xpath: '/h1',
        nodeName: 'H1',
      },
      // Custom element
      {
        xpath: '/span/ul/custom-element',
        nodeName: 'CUSTOM-ELEMENT',
      },
      // Embedded MathML
      {
        xpath: '/span/math/msqrt/mrow/mi',
        nodeName: 'mi',
      },
      {
        xpath: '/SPAN/MATH/MSQRT/MROW/MI',
        nodeName: 'mi',
      },
      // Embedded SVG
      {
        xpath: '/span[1]/svg[1]/text[2]',
        nodeName: 'text',
      },
    ].forEach((test) => {
      it('evaluates simple XPaths without using `document.evaluate`', () => {
        const result = nodeFromXPath(test.xpath, container);
        expect(document.evaluate).not.toHaveBeenCalled();
        expect(result?.nodeName).toBe(test.nodeName);
      });
    });

    ['/missing/element', '/span[0]'].forEach((xpath) => {
      it('returns `null` if simple XPath evaluation fails', () => {
        const result = nodeFromXPath(xpath, container);
        expect(document.evaluate).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });

    // FIXME: browser window.document issues
    // [
    //   ['/*[local-name()="h1"]', 'H1'],
    //   ['/span[-1]', null],
    // ].forEach(([xpath, expectedNodeName]) => {
    //   it('uses `document.evaluate` for non-simple XPaths', () => {
    //     const result = nodeFromXPath(xpath, container);
    //     expect(document.evaluate).toHaveBeenCalled();
    //     expect(result?.nodeName ?? result).toEqual(expectedNodeName);
    //   });
    // });

    it('throws an error for invalid XPath', () => {
      expect(() => {
        nodeFromXPath('not-a-valid-xpath', container);
      }).toThrow();
    });
  });
});
