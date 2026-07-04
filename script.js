const { BehaviorSubject, combineLatest } = rxjs;

function h(tag, props, ...children) {
  return {
    tag,
    props: {
      ...props,
      children: children.flat(Infinity).filter(c => c != null)
    }
  }
}

function render(vnode, container) {
  if (typeof vnode !== 'object') {
    return container.appendChild(document.createTextNode(vnode))
  }

  if (typeof vnode.tag === 'function') {
    return render(vnode.tag(vnode.props), container)
  }

  const el = document.createElement(vnode.tag);

  Object.entries(vnode.props || {}).forEach(([key, val]) => {
    if (key === 'children') return;
    if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), val)
    } else if (val?.subscribe) {
      val.subscribe(next => el.setAttribute(key, next))
    } else {
      el.setAttribute(key, val)
    }
  })

  vnode.props.children.forEach(child => {
    if (child?.subscribe) {
      const node = document.createTextNode('');
      child.subscribe((next) => node.nodeValue = next)
      el.appendChild(node);
    } else {
      render(child, el);
    }
  });

  return container.appendChild(el);
}

function createSignal(initial) {
  const $ = new BehaviorSubject(initial);
  return [$.asObservable(), v => $.next(v), () => $.value];
}

function effect(fn, deps) {
  return combineLatest(deps).subscribe(values => fn(...values));
}

// user scope
const [counter$, setCounter, getCounter] = createSignal(0)
const [color$, setColor] = createSignal('red')

const handleClick = () => {
  setCounter(getCounter() + 1)
  const colors = ['red', 'blue', 'green'];
  setColor(colors[Math.floor(Math.random() * colors.length)])
}
const ui = h('h1', null, counter$)
const color = h('p', null, color$)
const btn = h('button', { onClick: handleClick }, 'Click Me')
const div = h('div', null, [ui, color, btn])

effect((count, color) => {
  document.title = `${color}: ${count}`
}, [counter$, color$])

render(div, document.body);



