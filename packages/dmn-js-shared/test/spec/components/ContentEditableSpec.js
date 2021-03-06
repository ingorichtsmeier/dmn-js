/* global sinon */

import TestContainerSupport from 'mocha-test-container-support';

import { Component, render } from 'inferno';

import {
  setRange,
  getRange
} from 'selection-ranges';

import {
  matches
} from 'min-dom';

import {
  findRenderedDOMElementWithClass,
  findVNodeWithType
} from 'inferno-test-utils';

import {
  triggerInputEvent
} from 'test/util/EventUtil';

import ContentEditable from 'lib/components/ContentEditable';


describe('components/ContentEditable', function() {

  var container, vTree;

  function renderToNode(vnode) {
    const tree = renderIntoDocument(vnode);

    return findRenderedDOMElementWithClass(tree, 'content-editable');
  }

  function renderIntoDocument(vNode) {
    vTree = render(vNode, container);
    return vTree;
  }

  beforeEach(function() {
    container = TestContainerSupport.get(this);
  });

  afterEach(function() {
    render(null, container);
  });



  it('should render', function() {

    // given
    // text + whitespace + to-be-escaped HTML snippet
    var value = 'FOO <br/> BAR';

    // when
    const node = renderToNode(
      <ContentEditable
        className={ 'other' }
        value={ value } />
    );

    // then
    expect(node).to.exist;
    expect(innerText(node)).to.eql(value);

    expect(matches(node, '.other')).to.be.true;
  });


  describe('selection', function() {

    it('should update on value change', function() {

      // given
      class ParentComponent extends Component {
        constructor(props, context) {
          super(props, context);

          this.state = {
            value: 'FOO'
          };
        }

        render() {
          const { value } = this.state;

          return <ContentEditable value={ value } />;
        }
      }

      const vTree = <ParentComponent />;

      const parentComponent = findVNodeWithType(vTree, ParentComponent);

      const node = renderToNode(vTree);

      node.focus();

      // scenario (1): add line break

      // select F[OO]
      setRange(node, { start: 1, end: 3 });

      // when
      parentComponent.children.setState({
        value: 'FOO\nAAA'
      });

      // then
      expect(getRange(node)).to.eql({
        start: 7,
        end: 7
      });


      // scenario (2): remove content + line break mid string

      // select FO[O\nAA]A
      setRange(node, { start: 2, end: 6 });

      // when
      parentComponent.children.setState({
        value: 'FOA'
      });

      // then
      expect(getRange(node)).to.eql({
        start: 2,
        end: 2
      });
    });

  });


  describe('hooks', function() {

    it('should dispatch onFocus / onBlur', function() {

      // given
      var onBlur = sinon.spy();
      var onFocus = sinon.spy();

      const node = renderToNode(
        <ContentEditable
          onFocus={ onFocus }
          onBlur={ onBlur }
          value={ 'FOO' } />
      );

      // when
      node.focus();

      // then
      expect(onFocus).to.have.been.called;
      expect(onBlur).not.to.have.been.called;

      // when (2)
      node.blur();

      // then
      expect(onBlur).to.have.been.called;
    });


    it('should dispatch onInput', function() {

      // given
      var onInput = sinon.spy();

      const node = renderToNode(<ContentEditable onInput={ onInput } value={ 'FOO' } />);

      // when
      triggerInputEvent(node, 'BLUB');

      // then
      expect(innerText(node)).to.eql('BLUB');

      expect(onInput).to.have.been.calledWith('BLUB');
    });

  });

});


function innerText(node) {
  return node.innerText.replace(/\n$/, '');
}