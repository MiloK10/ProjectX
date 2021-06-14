
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.37.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

    /* src\pages\Home.svelte generated by Svelte v3.37.0 */
    const file$9 = "src\\pages\\Home.svelte";

    // (36:0) {#if visible}
    function create_if_block(ctx) {
    	let div2;
    	let h2;
    	let t1;
    	let div0;
    	let button;
    	let t2;
    	let t3;
    	let t4;
    	let t5_value = (/*count*/ ctx[0] === 1 ? "time" : "times") + "";
    	let t5;
    	let t6;
    	let t7;
    	let div1;
    	let iframe;
    	let iframe_src_value;
    	let div2_intro;
    	let div2_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "It's in the attached files";
    			t1 = space();
    			div0 = element("div");
    			button = element("button");
    			t2 = text("Click ");
    			t3 = text(/*count*/ ctx[0]);
    			t4 = text(" more ");
    			t5 = text(t5_value);
    			t6 = text(" to get the link to the screencast");
    			t7 = space();
    			div1 = element("div");
    			iframe = element("iframe");
    			add_location(h2, file$9, 37, 8, 981);
    			attr_dev(button, "class", "btn btn-outline-success border-2");
    			add_location(button, file$9, 40, 12, 1060);
    			attr_dev(div0, "class", "mb-2");
    			add_location(div0, file$9, 39, 8, 1028);
    			if (iframe.src !== (iframe_src_value = "https://www.youtube.com/embed/dQw4w9WgXcQ")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "YouTube Video");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$9, 46, 12, 1341);
    			attr_dev(div1, "class", "ratio ratio-16x9 w-75 mx-auto");
    			add_location(div1, file$9, 45, 8, 1284);
    			attr_dev(div2, "class", "row text-center px-3 pb-3");
    			add_location(div2, file$9, 36, 4, 855);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, button);
    			append_dev(button, t2);
    			append_dev(button, t3);
    			append_dev(button, t4);
    			append_dev(button, t5);
    			append_dev(button, t6);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			append_dev(div1, iframe);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleClick*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*count*/ 1) set_data_dev(t3, /*count*/ ctx[0]);
    			if ((!current || dirty & /*count*/ 1) && t5_value !== (t5_value = (/*count*/ ctx[0] === 1 ? "time" : "times") + "")) set_data_dev(t5, t5_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				if (!div2_intro) div2_intro = create_in_transition(div2, slide, { y: 200, duration: 1000 });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, slide, { y: 200, duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_outro) div2_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(36:0) {#if visible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let t2;
    	let div1;
    	let label;
    	let input;
    	let t3;
    	let span;
    	let t5;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*visible*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Welcome to my final project form Web Engineering";
    			t2 = space();
    			div1 = element("div");
    			label = element("label");
    			input = element("input");
    			t3 = space();
    			span = element("span");
    			span.textContent = "Click here to see the screencast of website's functions";
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(img, "class", "img-fluid logo");
    			attr_dev(img, "alt", "Krakow");
    			if (img.src !== (img_src_value = "images/krakow.jpg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$9, 19, 4, 362);
    			attr_dev(div0, "class", "my-2");
    			set_style(div0, "text-align", "center");
    			add_location(div0, file$9, 18, 0, 311);
    			attr_dev(h1, "class", "p-3");
    			add_location(h1, file$9, 22, 0, 441);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$9, 27, 8, 614);
    			attr_dev(span, "class", "mx-2");
    			add_location(span, file$9, 28, 8, 672);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$9, 26, 4, 580);
    			attr_dev(div1, "class", "text-center");
    			add_location(div1, file$9, 25, 0, 549);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label);
    			append_dev(label, input);
    			input.checked = /*visible*/ ctx[1];
    			append_dev(label, t3);
    			append_dev(label, span);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*visible*/ 2) {
    				input.checked = /*visible*/ ctx[1];
    			}

    			if (/*visible*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visible*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let visible = false;

    	// statements
    	let count = 5;

    	function handleClick() {
    		$$invalidate(0, count -= 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		visible = this.checked;
    		$$invalidate(1, visible);
    	}

    	$$self.$capture_state = () => ({ slide, visible, count, handleClick });

    	$$self.$inject_state = $$props => {
    		if ("visible" in $$props) $$invalidate(1, visible = $$props.visible);
    		if ("count" in $$props) $$invalidate(0, count = $$props.count);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*count*/ 1) {
    			if (count <= 0) {
    				alert(`here is the link: `);
    				$$invalidate(0, count = 1);
    			}
    		}
    	};

    	return [count, visible, handleClick, input_change_handler];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios$1 = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios$1.Axios = Axios_1;

    // Factory for creating new instances
    axios$1.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios$1.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios$1.Cancel = Cancel_1;
    axios$1.CancelToken = CancelToken_1;
    axios$1.isCancel = isCancel;

    // Expose all/spread
    axios$1.all = function all(promises) {
      return Promise.all(promises);
    };
    axios$1.spread = spread;

    // Expose isAxiosError
    axios$1.isAxiosError = isAxiosError;

    var axios_1 = axios$1;

    // Allow use of default import syntax in TypeScript
    var _default = axios$1;
    axios_1.default = _default;

    var axios = axios_1;

    /* src\pages\users\Users.svelte generated by Svelte v3.37.0 */
    const file$8 = "src\\pages\\users\\Users.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (36:12) {#each users as user}
    function create_each_block$6(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*user*/ ctx[2].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let a0;
    	let t2_value = /*user*/ ctx[2].name + "";
    	let t2;
    	let a0_href_value;
    	let t3;
    	let td2;
    	let a1;
    	let t4_value = /*user*/ ctx[2].email + "";
    	let t4;
    	let a1_href_value;
    	let t5;
    	let td3;
    	let t6_value = /*user*/ ctx[2].city + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			a0 = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			a1 = element("a");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			add_location(td0, file$8, 37, 16, 859);
    			attr_dev(a0, "href", a0_href_value = "#/users/" + /*user*/ ctx[2].id);
    			add_location(a0, file$8, 38, 20, 899);
    			add_location(td1, file$8, 38, 16, 895);
    			attr_dev(a1, "href", a1_href_value = "mailto:" + /*user*/ ctx[2].email);
    			add_location(a1, file$8, 39, 20, 972);
    			add_location(td2, file$8, 39, 16, 968);
    			add_location(td3, file$8, 40, 16, 1044);
    			add_location(tr, file$8, 36, 12, 837);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, a0);
    			append_dev(a0, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, a1);
    			append_dev(a1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*users*/ 1 && t0_value !== (t0_value = /*user*/ ctx[2].id + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*users*/ 1 && t2_value !== (t2_value = /*user*/ ctx[2].name + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*users*/ 1 && a0_href_value !== (a0_href_value = "#/users/" + /*user*/ ctx[2].id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*users*/ 1 && t4_value !== (t4_value = /*user*/ ctx[2].email + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*users*/ 1 && a1_href_value !== (a1_href_value = "mailto:" + /*user*/ ctx[2].email)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*users*/ 1 && t6_value !== (t6_value = /*user*/ ctx[2].city + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(36:12) {#each users as user}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let h1;
    	let t1;
    	let a;
    	let t3;
    	let div;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t5;
    	let th1;
    	let t7;
    	let th2;
    	let t9;
    	let th3;
    	let t11;
    	let tbody;
    	let each_value = /*users*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Users";
    			t1 = space();
    			a = element("a");
    			a.textContent = "+ Add new user";
    			t3 = space();
    			div = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "ID";
    			t5 = space();
    			th1 = element("th");
    			th1.textContent = "Name";
    			t7 = space();
    			th2 = element("th");
    			th2.textContent = "Email";
    			t9 = space();
    			th3 = element("th");
    			th3.textContent = "City";
    			t11 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$8, 18, 0, 356);
    			attr_dev(a, "href", "#/create-user");
    			attr_dev(a, "class", "btn btn-outline-danger border-2");
    			add_location(a, file$8, 20, 0, 374);
    			add_location(th0, file$8, 27, 16, 623);
    			add_location(th1, file$8, 28, 16, 652);
    			add_location(th2, file$8, 29, 16, 683);
    			add_location(th3, file$8, 30, 16, 715);
    			add_location(tr, file$8, 26, 12, 601);
    			add_location(thead, file$8, 25, 8, 580);
    			add_location(tbody, file$8, 34, 8, 781);
    			attr_dev(table, "class", "table table-secondary table-striped table-hover table-borderless");
    			add_location(table, file$8, 23, 4, 488);
    			attr_dev(div, "class", "bdr mt-3");
    			add_location(div, file$8, 22, 0, 460);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t5);
    			append_dev(tr, th1);
    			append_dev(tr, t7);
    			append_dev(tr, th2);
    			append_dev(tr, t9);
    			append_dev(tr, th3);
    			append_dev(table, t11);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*users*/ 1) {
    				each_value = /*users*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Users", slots, []);
    	let users = [];

    	onMount(() => {
    		getUsers();
    	});

    	function getUsers() {
    		axios.get("http://localhost:8080/projectx/users").then(response => {
    			$$invalidate(0, users = response.data);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Users> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ axios, onMount, users, getUsers });

    	$$self.$inject_state = $$props => {
    		if ("users" in $$props) $$invalidate(0, users = $$props.users);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [users];
    }

    class Users extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Users",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\pages\users\UserDetails.svelte generated by Svelte v3.37.0 */
    const file$7 = "src\\pages\\users\\UserDetails.svelte";

    function create_fragment$7(ctx) {
    	let h1;
    	let t0;
    	let b;
    	let t1_value = /*user*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let div0;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let div13;
    	let div3;
    	let h20;
    	let button0;
    	let t8;
    	let div2;
    	let div1;
    	let a2;
    	let t9_value = /*user*/ ctx[0].email + "";
    	let t9;
    	let a2_href_value;
    	let t10;
    	let div6;
    	let h21;
    	let button1;
    	let t12;
    	let div5;
    	let div4;
    	let t13_value = /*user*/ ctx[0].city + "";
    	let t13;
    	let t14;
    	let div9;
    	let h22;
    	let button2;
    	let t16;
    	let div8;
    	let div7;
    	let t17_value = /*user*/ ctx[0].age + "";
    	let t17;
    	let t18;
    	let div12;
    	let h23;
    	let button3;
    	let t20;
    	let div11;
    	let div10;
    	let t21_value = /*user*/ ctx[0].gender + "";
    	let t21;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Personal details for ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Go to all users";
    			t4 = space();
    			a1 = element("a");
    			a1.textContent = "Go to all permissions";
    			t6 = space();
    			div13 = element("div");
    			div3 = element("div");
    			h20 = element("h2");
    			button0 = element("button");
    			button0.textContent = "Email";
    			t8 = space();
    			div2 = element("div");
    			div1 = element("div");
    			a2 = element("a");
    			t9 = text(t9_value);
    			t10 = space();
    			div6 = element("div");
    			h21 = element("h2");
    			button1 = element("button");
    			button1.textContent = "Place of residence";
    			t12 = space();
    			div5 = element("div");
    			div4 = element("div");
    			t13 = text(t13_value);
    			t14 = space();
    			div9 = element("div");
    			h22 = element("h2");
    			button2 = element("button");
    			button2.textContent = "Age";
    			t16 = space();
    			div8 = element("div");
    			div7 = element("div");
    			t17 = text(t17_value);
    			t18 = space();
    			div12 = element("div");
    			h23 = element("h2");
    			button3 = element("button");
    			button3.textContent = "Gender";
    			t20 = space();
    			div11 = element("div");
    			div10 = element("div");
    			t21 = text(t21_value);
    			add_location(b, file$7, 20, 25, 419);
    			add_location(h1, file$7, 20, 0, 394);
    			attr_dev(a0, "href", "#/users");
    			attr_dev(a0, "class", "btn btn-outline-danger border-2");
    			add_location(a0, file$7, 24, 4, 503);
    			attr_dev(a1, "href", "#/permissions");
    			attr_dev(a1, "class", "btn btn-warning border-2");
    			add_location(a1, file$7, 25, 4, 586);
    			attr_dev(div0, "class", "my-2");
    			add_location(div0, file$7, 23, 0, 479);
    			attr_dev(button0, "class", "accordion-button collapsed");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "data-bs-toggle", "collapse");
    			attr_dev(button0, "data-bs-target", "#flush-collapseEmail");
    			attr_dev(button0, "aria-expanded", "false");
    			attr_dev(button0, "aria-controls", "flush-collapseEmail");
    			add_location(button0, file$7, 33, 12, 857);
    			attr_dev(h20, "class", "accordion-header");
    			attr_dev(h20, "id", "flush-email");
    			add_location(h20, file$7, 32, 8, 797);
    			attr_dev(a2, "href", a2_href_value = "mailto:" + /*user*/ ctx[0].email);
    			add_location(a2, file$7, 38, 40, 1271);
    			attr_dev(div1, "class", "accordion-body");
    			add_location(div1, file$7, 38, 12, 1243);
    			attr_dev(div2, "id", "flush-collapseEmail");
    			attr_dev(div2, "class", "accordion-collapse collapse");
    			attr_dev(div2, "aria-labelledby", "flush-email");
    			attr_dev(div2, "data-bs-parent", "#details");
    			add_location(div2, file$7, 37, 8, 1107);
    			attr_dev(div3, "class", "accordion-item");
    			add_location(div3, file$7, 31, 4, 759);
    			attr_dev(button1, "class", "accordion-button collapsed");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "data-bs-toggle", "collapse");
    			attr_dev(button1, "data-bs-target", "#flush-collapseCity");
    			attr_dev(button1, "aria-expanded", "false");
    			attr_dev(button1, "aria-controls", "flush-collapseCity");
    			add_location(button1, file$7, 43, 12, 1457);
    			attr_dev(h21, "class", "accordion-header");
    			attr_dev(h21, "id", "flush-city");
    			add_location(h21, file$7, 42, 8, 1398);
    			attr_dev(div4, "class", "accordion-body");
    			add_location(div4, file$7, 48, 12, 1852);
    			attr_dev(div5, "id", "flush-collapseCity");
    			attr_dev(div5, "class", "accordion-collapse collapse");
    			attr_dev(div5, "aria-labelledby", "flush-city");
    			attr_dev(div5, "data-bs-parent", "#details");
    			add_location(div5, file$7, 47, 8, 1718);
    			attr_dev(div6, "class", "accordion-item");
    			add_location(div6, file$7, 41, 4, 1360);
    			attr_dev(button2, "class", "accordion-button collapsed");
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "data-bs-toggle", "collapse");
    			attr_dev(button2, "data-bs-target", "#flush-collapseAge");
    			attr_dev(button2, "aria-expanded", "false");
    			attr_dev(button2, "aria-controls", "flush-collapseAge");
    			add_location(button2, file$7, 53, 12, 2027);
    			attr_dev(h22, "class", "accordion-header");
    			attr_dev(h22, "id", "flush-age");
    			add_location(h22, file$7, 52, 8, 1969);
    			attr_dev(div7, "class", "accordion-body");
    			add_location(div7, file$7, 58, 12, 2403);
    			attr_dev(div8, "id", "flush-collapseAge");
    			attr_dev(div8, "class", "accordion-collapse collapse");
    			attr_dev(div8, "aria-labelledby", "flush-age");
    			attr_dev(div8, "data-bs-parent", "#details");
    			add_location(div8, file$7, 57, 8, 2271);
    			attr_dev(div9, "class", "accordion-item");
    			add_location(div9, file$7, 51, 4, 1931);
    			attr_dev(button3, "class", "accordion-button collapsed");
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "data-bs-toggle", "collapse");
    			attr_dev(button3, "data-bs-target", "#flush-collapseGender");
    			attr_dev(button3, "aria-expanded", "false");
    			attr_dev(button3, "aria-controls", "flush-collapseGender");
    			add_location(button3, file$7, 63, 12, 2580);
    			attr_dev(h23, "class", "accordion-header");
    			attr_dev(h23, "id", "flush-gender");
    			add_location(h23, file$7, 62, 8, 2519);
    			attr_dev(div10, "class", "accordion-body");
    			add_location(div10, file$7, 68, 12, 2971);
    			attr_dev(div11, "id", "flush-collapseGender");
    			attr_dev(div11, "class", "accordion-collapse collapse");
    			attr_dev(div11, "aria-labelledby", "flush-gender");
    			attr_dev(div11, "data-bs-parent", "#details");
    			add_location(div11, file$7, 67, 8, 2833);
    			attr_dev(div12, "class", "accordion-item");
    			add_location(div12, file$7, 61, 4, 2481);
    			attr_dev(div13, "class", "accordion");
    			attr_dev(div13, "id", "details");
    			add_location(div13, file$7, 30, 0, 717);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, b);
    			append_dev(b, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, a0);
    			append_dev(div0, t4);
    			append_dev(div0, a1);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div3);
    			append_dev(div3, h20);
    			append_dev(h20, button0);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, a2);
    			append_dev(a2, t9);
    			append_dev(div13, t10);
    			append_dev(div13, div6);
    			append_dev(div6, h21);
    			append_dev(h21, button1);
    			append_dev(div6, t12);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, t13);
    			append_dev(div13, t14);
    			append_dev(div13, div9);
    			append_dev(div9, h22);
    			append_dev(h22, button2);
    			append_dev(div9, t16);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, t17);
    			append_dev(div13, t18);
    			append_dev(div13, div12);
    			append_dev(div12, h23);
    			append_dev(h23, button3);
    			append_dev(div12, t20);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, t21);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*user*/ 1 && t1_value !== (t1_value = /*user*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*user*/ 1 && t9_value !== (t9_value = /*user*/ ctx[0].email + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*user*/ 1 && a2_href_value !== (a2_href_value = "mailto:" + /*user*/ ctx[0].email)) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (dirty & /*user*/ 1 && t13_value !== (t13_value = /*user*/ ctx[0].city + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*user*/ 1 && t17_value !== (t17_value = /*user*/ ctx[0].age + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*user*/ 1 && t21_value !== (t21_value = /*user*/ ctx[0].gender + "")) set_data_dev(t21, t21_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div13);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("UserDetails", slots, []);
    	let { params = {} } = $$props;
    	let userId;
    	let user = {};

    	function getUser() {
    		axios.get("http://localhost:8080/projectx/users/id/" + userId).then(response => {
    			$$invalidate(0, user = response.data);
    		});
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UserDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({ axios, params, userId, user, getUser });

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("userId" in $$props) userId = $$props.userId;
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 2) {
    			{
    				userId = params.id;
    				getUser();
    			}
    		}
    	};

    	return [user, params];
    }

    class UserDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserDetails",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get params() {
    		throw new Error("<UserDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<UserDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\users\CreateUser.svelte generated by Svelte v3.37.0 */
    const file$6 = "src\\pages\\users\\CreateUser.svelte";

    function create_fragment$6(ctx) {
    	let h1;
    	let t1;
    	let a;
    	let t3;
    	let div10;
    	let form;
    	let div1;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let div0;
    	let t7_value = /*errors*/ ctx[1].name + "";
    	let t7;
    	let t8;
    	let div3;
    	let label1;
    	let t10;
    	let input1;
    	let t11;
    	let div2;
    	let t12_value = /*errors*/ ctx[1].email + "";
    	let t12;
    	let t13;
    	let div5;
    	let label2;
    	let t15;
    	let input2;
    	let t16;
    	let div4;
    	let t17_value = /*errors*/ ctx[1].city + "";
    	let t17;
    	let t18;
    	let div7;
    	let label3;
    	let t20;
    	let input3;
    	let t21;
    	let div6;
    	let t22_value = /*errors*/ ctx[1].age + "";
    	let t22;
    	let t23;
    	let div9;
    	let label4;
    	let t25;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t29;
    	let div8;
    	let t30_value = /*errors*/ ctx[1].gender + "";
    	let t30;
    	let t31;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Create new user";
    			t1 = space();
    			a = element("a");
    			a.textContent = "Go back to users";
    			t3 = space();
    			div10 = element("div");
    			form = element("form");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Name";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div0 = element("div");
    			t7 = text(t7_value);
    			t8 = space();
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "Email";
    			t10 = space();
    			input1 = element("input");
    			t11 = space();
    			div2 = element("div");
    			t12 = text(t12_value);
    			t13 = space();
    			div5 = element("div");
    			label2 = element("label");
    			label2.textContent = "Place of residence";
    			t15 = space();
    			input2 = element("input");
    			t16 = space();
    			div4 = element("div");
    			t17 = text(t17_value);
    			t18 = space();
    			div7 = element("div");
    			label3 = element("label");
    			label3.textContent = "Age";
    			t20 = space();
    			input3 = element("input");
    			t21 = space();
    			div6 = element("div");
    			t22 = text(t22_value);
    			t23 = space();
    			div9 = element("div");
    			label4 = element("label");
    			label4.textContent = "Gender";
    			t25 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Select gender";
    			option1 = element("option");
    			option1.textContent = "Male";
    			option2 = element("option");
    			option2.textContent = "Female";
    			t29 = space();
    			div8 = element("div");
    			t30 = text(t30_value);
    			t31 = space();
    			button = element("button");
    			button.textContent = "Create";
    			add_location(h1, file$6, 77, 0, 1779);
    			attr_dev(a, "href", "#/users");
    			attr_dev(a, "class", "btn btn-outline-danger border-2");
    			add_location(a, file$6, 79, 0, 1807);
    			attr_dev(label0, "class", "form-label");
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$6, 85, 12, 2073);
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter name and surname");
    			add_location(input0, file$6, 86, 12, 2137);
    			attr_dev(div0, "class", "error");
    			add_location(div0, file$6, 87, 12, 2251);
    			attr_dev(div1, "class", "form-field mb-3 col-6");
    			add_location(div1, file$6, 84, 8, 2024);
    			attr_dev(label1, "class", "form-label");
    			attr_dev(label1, "for", "Email");
    			add_location(label1, file$6, 90, 12, 2366);
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "type", "email");
    			attr_dev(input1, "placeholder", "Enter email address");
    			add_location(input1, file$6, 91, 12, 2431);
    			attr_dev(div2, "class", "error");
    			add_location(div2, file$6, 92, 12, 2544);
    			attr_dev(div3, "class", "form-field mb-3 col-6");
    			add_location(div3, file$6, 89, 8, 2317);
    			attr_dev(label2, "class", "form-label");
    			attr_dev(label2, "for", "City");
    			add_location(label2, file$6, 95, 12, 2660);
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "Enter place of residence");
    			add_location(input2, file$6, 96, 12, 2737);
    			attr_dev(div4, "class", "error");
    			add_location(div4, file$6, 97, 12, 2853);
    			attr_dev(div5, "class", "form-field mb-3 col-6");
    			add_location(div5, file$6, 94, 8, 2611);
    			attr_dev(label3, "class", "form-label");
    			attr_dev(label3, "for", "Age");
    			add_location(label3, file$6, 100, 12, 2968);
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "placeholder", "Enter age");
    			add_location(input3, file$6, 101, 12, 3029);
    			attr_dev(div6, "class", "error");
    			add_location(div6, file$6, 102, 12, 3131);
    			attr_dev(div7, "class", "form-field mb-3 col-2");
    			add_location(div7, file$6, 99, 8, 2919);
    			attr_dev(label4, "class", "form-label");
    			attr_dev(label4, "for", "gender");
    			add_location(label4, file$6, 105, 12, 3245);
    			option0.selected = true;
    			option0.__value = "Select gender";
    			option0.value = option0.__value;
    			add_location(option0, file$6, 107, 16, 3403);
    			option1.__value = "Male";
    			option1.value = option1.__value;
    			add_location(option1, file$6, 108, 16, 3460);
    			option2.__value = "Female";
    			option2.value = option2.__value;
    			add_location(option2, file$6, 109, 16, 3512);
    			attr_dev(select, "class", "form-select");
    			attr_dev(select, "aria-label", "Select");
    			if (/*user*/ ctx[0].gender === void 0) add_render_callback(() => /*select_change_handler*/ ctx[7].call(select));
    			add_location(select, file$6, 106, 12, 3312);
    			attr_dev(div8, "class", "error");
    			add_location(div8, file$6, 111, 12, 3587);
    			attr_dev(div9, "class", "form-field mb-3 col-4");
    			add_location(div9, file$6, 104, 8, 3196);
    			attr_dev(button, "type", "secondary");
    			attr_dev(button, "class", "btn btn-outline-success border-2 col-1 offset-6");
    			add_location(button, file$6, 114, 8, 3660);
    			attr_dev(form, "class", "row text-center");
    			add_location(form, file$6, 83, 4, 1943);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$6, 82, 0, 1920);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, form);
    			append_dev(form, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t5);
    			append_dev(div1, input0);
    			set_input_value(input0, /*user*/ ctx[0].name);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    			append_dev(div0, t7);
    			append_dev(form, t8);
    			append_dev(form, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t10);
    			append_dev(div3, input1);
    			set_input_value(input1, /*user*/ ctx[0].email);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			append_dev(div2, t12);
    			append_dev(form, t13);
    			append_dev(form, div5);
    			append_dev(div5, label2);
    			append_dev(div5, t15);
    			append_dev(div5, input2);
    			set_input_value(input2, /*user*/ ctx[0].city);
    			append_dev(div5, t16);
    			append_dev(div5, div4);
    			append_dev(div4, t17);
    			append_dev(form, t18);
    			append_dev(form, div7);
    			append_dev(div7, label3);
    			append_dev(div7, t20);
    			append_dev(div7, input3);
    			set_input_value(input3, /*user*/ ctx[0].age);
    			append_dev(div7, t21);
    			append_dev(div7, div6);
    			append_dev(div6, t22);
    			append_dev(form, t23);
    			append_dev(form, div9);
    			append_dev(div9, label4);
    			append_dev(div9, t25);
    			append_dev(div9, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*user*/ ctx[0].gender);
    			append_dev(div9, t29);
    			append_dev(div9, div8);
    			append_dev(div8, t30);
    			append_dev(form, t31);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[5]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[6]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[7]),
    					listen_dev(form, "submit", prevent_default(/*submitHandler*/ ctx[2]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*user*/ 1 && input0.value !== /*user*/ ctx[0].name) {
    				set_input_value(input0, /*user*/ ctx[0].name);
    			}

    			if (dirty & /*errors*/ 2 && t7_value !== (t7_value = /*errors*/ ctx[1].name + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*user*/ 1 && input1.value !== /*user*/ ctx[0].email) {
    				set_input_value(input1, /*user*/ ctx[0].email);
    			}

    			if (dirty & /*errors*/ 2 && t12_value !== (t12_value = /*errors*/ ctx[1].email + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*user*/ 1 && input2.value !== /*user*/ ctx[0].city) {
    				set_input_value(input2, /*user*/ ctx[0].city);
    			}

    			if (dirty & /*errors*/ 2 && t17_value !== (t17_value = /*errors*/ ctx[1].city + "")) set_data_dev(t17, t17_value);

    			if (dirty & /*user*/ 1 && to_number(input3.value) !== /*user*/ ctx[0].age) {
    				set_input_value(input3, /*user*/ ctx[0].age);
    			}

    			if (dirty & /*errors*/ 2 && t22_value !== (t22_value = /*errors*/ ctx[1].age + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*user*/ 1) {
    				select_option(select, /*user*/ ctx[0].gender);
    			}

    			if (dirty & /*errors*/ 2 && t30_value !== (t30_value = /*errors*/ ctx[1].gender + "")) set_data_dev(t30, t30_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div10);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CreateUser", slots, []);

    	let user = {
    		name: "",
    		gender: "",
    		age: null,
    		city: "",
    		email: ""
    	};

    	function createUser() {
    		axios.post("http://localhost:8080/projectx/users", user).then(response => {
    			alert("User was successfully created");
    		});
    	}

    	// validation
    	let errors = {
    		name: "",
    		email: "",
    		city: "",
    		gender: "",
    		age: ""
    	};

    	let valid = false;

    	const submitHandler = () => {
    		valid = true;

    		// validate name
    		if (user.name.trim().length < 1) {
    			valid = false;
    			$$invalidate(1, errors.name = "Please enter name", errors);
    		} else {
    			$$invalidate(1, errors.name = "", errors);
    		}

    		// validate email
    		if (user.email.trim().length < 1) {
    			valid = false;
    			$$invalidate(1, errors.email = "Please enter email", errors);
    		} else {
    			$$invalidate(1, errors.email = "", errors);
    		}

    		// validate age
    		if (user.age === null) {
    			valid = false;
    			$$invalidate(1, errors.age = "Please enter age", errors);
    		} else {
    			$$invalidate(1, errors.age = "", errors);
    		}

    		// validate city
    		if (user.city.trim().length < 1) {
    			valid = false;
    			$$invalidate(1, errors.city = "Please enter city", errors);
    		} else {
    			$$invalidate(1, errors.city = "", errors);
    		}

    		// validate gender
    		if (user.gender.trim().length < 1) {
    			valid = false;
    			$$invalidate(1, errors.gender = "Please enter gender", errors);
    		} else {
    			$$invalidate(1, errors.gender = "", errors);
    		}

    		if (valid) {
    			createUser();
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CreateUser> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		user.name = this.value;
    		$$invalidate(0, user);
    	}

    	function input1_input_handler() {
    		user.email = this.value;
    		$$invalidate(0, user);
    	}

    	function input2_input_handler() {
    		user.city = this.value;
    		$$invalidate(0, user);
    	}

    	function input3_input_handler() {
    		user.age = to_number(this.value);
    		$$invalidate(0, user);
    	}

    	function select_change_handler() {
    		user.gender = select_value(this);
    		$$invalidate(0, user);
    	}

    	$$self.$capture_state = () => ({
    		axios,
    		user,
    		createUser,
    		errors,
    		valid,
    		submitHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    		if ("errors" in $$props) $$invalidate(1, errors = $$props.errors);
    		if ("valid" in $$props) valid = $$props.valid;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		user,
    		errors,
    		submitHandler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		select_change_handler
    	];
    }

    class CreateUser extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateUser",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\pages\permissions\Permissions.svelte generated by Svelte v3.37.0 */
    const file$5 = "src\\pages\\permissions\\Permissions.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (34:12) {#each permissions as permission}
    function create_each_block$5(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*permission*/ ctx[2].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let a0;
    	let t2_value = /*permission*/ ctx[2].user.name + "";
    	let t2;
    	let a0_href_value;
    	let t3;
    	let td2;
    	let a1;
    	let t4_value = /*permission*/ ctx[2].app.name + "";
    	let t4;
    	let a1_href_value;
    	let t5;
    	let td3;
    	let t6_value = /*permission*/ ctx[2].date + "";
    	let t6;
    	let t7;
    	let td4;
    	let a2;
    	let t8_value = /*permission*/ ctx[2].node.name + "";
    	let t8;
    	let a2_href_value;
    	let t9;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			a0 = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			a1 = element("a");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			a2 = element("a");
    			t8 = text(t8_value);
    			t9 = space();
    			add_location(td0, file$5, 35, 16, 870);
    			attr_dev(a0, "href", a0_href_value = "#/users/" + /*permission*/ ctx[2].user.id);
    			add_location(a0, file$5, 36, 20, 916);
    			add_location(td1, file$5, 36, 16, 912);
    			attr_dev(a1, "href", a1_href_value = "#/apps/" + /*permission*/ ctx[2].app.id);
    			add_location(a1, file$5, 37, 20, 1011);
    			add_location(td2, file$5, 37, 16, 1007);
    			add_location(td3, file$5, 38, 16, 1099);
    			attr_dev(a2, "href", a2_href_value = "#/nodes/" + /*permission*/ ctx[2].node.id);
    			add_location(a2, file$5, 39, 20, 1147);
    			add_location(td4, file$5, 39, 16, 1143);
    			add_location(tr, file$5, 34, 12, 848);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, a0);
    			append_dev(a0, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, a1);
    			append_dev(a1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, a2);
    			append_dev(a2, t8);
    			append_dev(tr, t9);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*permissions*/ 1 && t0_value !== (t0_value = /*permission*/ ctx[2].id + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*permissions*/ 1 && t2_value !== (t2_value = /*permission*/ ctx[2].user.name + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*permissions*/ 1 && a0_href_value !== (a0_href_value = "#/users/" + /*permission*/ ctx[2].user.id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*permissions*/ 1 && t4_value !== (t4_value = /*permission*/ ctx[2].app.name + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*permissions*/ 1 && a1_href_value !== (a1_href_value = "#/apps/" + /*permission*/ ctx[2].app.id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*permissions*/ 1 && t6_value !== (t6_value = /*permission*/ ctx[2].date + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*permissions*/ 1 && t8_value !== (t8_value = /*permission*/ ctx[2].node.name + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*permissions*/ 1 && a2_href_value !== (a2_href_value = "#/nodes/" + /*permission*/ ctx[2].node.id)) {
    				attr_dev(a2, "href", a2_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(34:12) {#each permissions as permission}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let h1;
    	let t1;
    	let div;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let th2;
    	let t7;
    	let th3;
    	let t9;
    	let th4;
    	let t11;
    	let tbody;
    	let each_value = /*permissions*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "This is a list of all permissions";
    			t1 = space();
    			div = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "ID";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "Name";
    			t5 = space();
    			th2 = element("th");
    			th2.textContent = "App";
    			t7 = space();
    			th3 = element("th");
    			th3.textContent = "Date";
    			t9 = space();
    			th4 = element("th");
    			th4.textContent = "Node";
    			t11 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$5, 18, 0, 386);
    			add_location(th0, file$5, 24, 16, 593);
    			add_location(th1, file$5, 25, 16, 622);
    			add_location(th2, file$5, 26, 16, 653);
    			add_location(th3, file$5, 27, 16, 683);
    			add_location(th4, file$5, 28, 16, 714);
    			add_location(tr, file$5, 23, 12, 571);
    			add_location(thead, file$5, 22, 8, 550);
    			add_location(tbody, file$5, 32, 8, 780);
    			attr_dev(table, "class", "table table-secondary table-striped table-hover table-borderless");
    			add_location(table, file$5, 21, 4, 460);
    			attr_dev(div, "class", "bdr mt-3");
    			add_location(div, file$5, 20, 0, 432);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t3);
    			append_dev(tr, th1);
    			append_dev(tr, t5);
    			append_dev(tr, th2);
    			append_dev(tr, t7);
    			append_dev(tr, th3);
    			append_dev(tr, t9);
    			append_dev(tr, th4);
    			append_dev(table, t11);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*permissions*/ 1) {
    				each_value = /*permissions*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Permissions", slots, []);
    	let permissions = [];

    	onMount(() => {
    		getPermissions();
    	});

    	function getPermissions() {
    		axios.get("http://localhost:8080/projectx/permissions").then(response => {
    			$$invalidate(0, permissions = response.data);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Permissions> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		axios,
    		onMount,
    		permissions,
    		getPermissions
    	});

    	$$self.$inject_state = $$props => {
    		if ("permissions" in $$props) $$invalidate(0, permissions = $$props.permissions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [permissions];
    }

    class Permissions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Permissions",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\pages\apps\Apps.svelte generated by Svelte v3.37.0 */
    const file$4 = "src\\pages\\apps\\Apps.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (32:12) {#each apps as app}
    function create_each_block$4(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*app*/ ctx[2].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let a;
    	let t2_value = /*app*/ ctx[2].name + "";
    	let t2;
    	let a_href_value;
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(td0, file$4, 33, 16, 730);
    			attr_dev(a, "href", a_href_value = "#/apps/" + /*app*/ ctx[2].id);
    			add_location(a, file$4, 34, 20, 769);
    			add_location(td1, file$4, 34, 16, 765);
    			add_location(tr, file$4, 32, 12, 708);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, a);
    			append_dev(a, t2);
    			append_dev(tr, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*apps*/ 1 && t0_value !== (t0_value = /*app*/ ctx[2].id + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*apps*/ 1 && t2_value !== (t2_value = /*app*/ ctx[2].name + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*apps*/ 1 && a_href_value !== (a_href_value = "#/apps/" + /*app*/ ctx[2].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(32:12) {#each apps as app}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let h1;
    	let t1;
    	let div;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let tbody;
    	let each_value = /*apps*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Apps";
    			t1 = space();
    			div = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "ID";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "Application name";
    			t5 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$4, 18, 0, 367);
    			add_location(th0, file$4, 25, 16, 547);
    			add_location(th1, file$4, 26, 16, 576);
    			add_location(tr, file$4, 24, 12, 525);
    			add_location(thead, file$4, 23, 8, 504);
    			add_location(tbody, file$4, 30, 8, 654);
    			attr_dev(table, "class", "table table-secondary table-striped table-hover table-borderless");
    			add_location(table, file$4, 21, 4, 412);
    			attr_dev(div, "class", "bdr mt-3");
    			add_location(div, file$4, 20, 0, 384);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t3);
    			append_dev(tr, th1);
    			append_dev(table, t5);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*apps*/ 1) {
    				each_value = /*apps*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Apps", slots, []);
    	let apps = [];

    	onMount(() => {
    		getApplications();
    	});

    	function getApplications() {
    		axios.get("http://localhost:8080/projectx/apps").then(response => {
    			$$invalidate(0, apps = response.data);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Apps> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ axios, onMount, apps, getApplications });

    	$$self.$inject_state = $$props => {
    		if ("apps" in $$props) $$invalidate(0, apps = $$props.apps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [apps];
    }

    class Apps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Apps",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\pages\apps\AppDetails.svelte generated by Svelte v3.37.0 */
    const file$3 = "src\\pages\\apps\\AppDetails.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (79:24) {#each permission as perm}
    function create_each_block$3(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*perm*/ ctx[6].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let a0;
    	let t2_value = /*perm*/ ctx[6].user.name + "";
    	let t2;
    	let a0_href_value;
    	let t3;
    	let td2;
    	let t4_value = /*perm*/ ctx[6].date + "";
    	let t4;
    	let t5;
    	let td3;
    	let a1;
    	let t6_value = /*perm*/ ctx[6].node.name + "";
    	let t6;
    	let a1_href_value;
    	let t7;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			a0 = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			a1 = element("a");
    			t6 = text(t6_value);
    			t7 = space();
    			add_location(td0, file$3, 80, 32, 2394);
    			attr_dev(a0, "href", a0_href_value = "#/users/" + /*perm*/ ctx[6].user.id);
    			add_location(a0, file$3, 81, 36, 2450);
    			add_location(td1, file$3, 81, 32, 2446);
    			add_location(td2, file$3, 82, 32, 2545);
    			attr_dev(a1, "href", a1_href_value = "#/nodes/" + /*perm*/ ctx[6].node.id);
    			add_location(a1, file$3, 83, 36, 2603);
    			add_location(td3, file$3, 83, 32, 2599);
    			add_location(tr, file$3, 79, 28, 2356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, a0);
    			append_dev(a0, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, a1);
    			append_dev(a1, t6);
    			append_dev(tr, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*permission*/ 2 && t0_value !== (t0_value = /*perm*/ ctx[6].id + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*permission*/ 2 && t2_value !== (t2_value = /*perm*/ ctx[6].user.name + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*permission*/ 2 && a0_href_value !== (a0_href_value = "#/users/" + /*perm*/ ctx[6].user.id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*permission*/ 2 && t4_value !== (t4_value = /*perm*/ ctx[6].date + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*permission*/ 2 && t6_value !== (t6_value = /*perm*/ ctx[6].node.name + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*permission*/ 2 && a1_href_value !== (a1_href_value = "#/nodes/" + /*perm*/ ctx[6].node.id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(79:24) {#each permission as perm}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let h1;
    	let t0;
    	let b;
    	let t1_value = /*app*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let div0;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let div4;
    	let div3;
    	let h2;
    	let button;
    	let t8;
    	let div2;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t10;
    	let th1;
    	let t12;
    	let th2;
    	let t14;
    	let th3;
    	let t16;
    	let tbody;
    	let each_value = /*permission*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("App details for ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Go to all locations";
    			t4 = space();
    			a1 = element("a");
    			a1.textContent = "Go to all permissions";
    			t6 = space();
    			div4 = element("div");
    			div3 = element("div");
    			h2 = element("h2");
    			button = element("button");
    			button.textContent = "List of all permissions for this app";
    			t8 = space();
    			div2 = element("div");
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Permission ID";
    			t10 = space();
    			th1 = element("th");
    			th1.textContent = "User's name";
    			t12 = space();
    			th2 = element("th");
    			th2.textContent = "Date";
    			t14 = space();
    			th3 = element("th");
    			th3.textContent = "Node";
    			t16 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(b, file$3, 31, 20, 703);
    			add_location(h1, file$3, 31, 0, 683);
    			attr_dev(a0, "href", "#/apps");
    			attr_dev(a0, "class", "btn btn-outline-danger border-2");
    			add_location(a0, file$3, 35, 4, 775);
    			attr_dev(a1, "href", "#/permissions");
    			attr_dev(a1, "class", "btn btn-outline-warning border-2");
    			add_location(a1, file$3, 38, 4, 877);
    			attr_dev(div0, "class", "my-2");
    			add_location(div0, file$3, 34, 0, 751);
    			attr_dev(button, "class", "accordion-button collapsed");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-bs-toggle", "collapse");
    			attr_dev(button, "data-bs-target", "#flush-collapseDetail");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-controls", "flush-collapseDetail");
    			add_location(button, file$3, 47, 12, 1170);
    			attr_dev(h2, "class", "accordion-header");
    			attr_dev(h2, "id", "flush-details");
    			add_location(h2, file$3, 46, 8, 1108);
    			add_location(th0, file$3, 70, 28, 2024);
    			add_location(th1, file$3, 71, 28, 2076);
    			add_location(th2, file$3, 72, 28, 2126);
    			add_location(th3, file$3, 73, 28, 2169);
    			add_location(tr, file$3, 69, 24, 1990);
    			add_location(thead, file$3, 68, 20, 1957);
    			add_location(tbody, file$3, 77, 20, 2267);
    			attr_dev(table, "class", "table table-secondary table-striped table-hover table-borderless");
    			add_location(table, file$3, 65, 16, 1816);
    			attr_dev(div1, "class", "accordion-body");
    			add_location(div1, file$3, 64, 12, 1770);
    			attr_dev(div2, "id", "flush-collapseDetail");
    			attr_dev(div2, "class", "accordion-collapse collapse");
    			attr_dev(div2, "aria-labelledby", "flush-details");
    			attr_dev(div2, "data-bs-parent", "#details");
    			add_location(div2, file$3, 58, 8, 1569);
    			attr_dev(div3, "class", "accordion-item");
    			add_location(div3, file$3, 45, 4, 1070);
    			attr_dev(div4, "class", "accordion");
    			attr_dev(div4, "id", "details");
    			add_location(div4, file$3, 44, 0, 1028);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, b);
    			append_dev(b, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, a0);
    			append_dev(div0, t4);
    			append_dev(div0, a1);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, h2);
    			append_dev(h2, button);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t10);
    			append_dev(tr, th1);
    			append_dev(tr, t12);
    			append_dev(tr, th2);
    			append_dev(tr, t14);
    			append_dev(tr, th3);
    			append_dev(table, t16);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*app*/ 1 && t1_value !== (t1_value = /*app*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*permission*/ 2) {
    				each_value = /*permission*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AppDetails", slots, []);
    	let { params = {} } = $$props;
    	let appID;
    	let app = {};
    	let permission = [];

    	function getApp() {
    		axios.get("http://localhost:8080/projectx/apps/id/" + appID).then(response => {
    			$$invalidate(0, app = response.data);
    		});
    	}

    	function getAllPermission() {
    		axios.get("http://localhost:8080/projectx/permissions/app/" + appID).then(response => {
    			$$invalidate(1, permission = response.data);
    		});
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		axios,
    		params,
    		appID,
    		app,
    		permission,
    		getApp,
    		getAllPermission
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("appID" in $$props) appID = $$props.appID;
    		if ("app" in $$props) $$invalidate(0, app = $$props.app);
    		if ("permission" in $$props) $$invalidate(1, permission = $$props.permission);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 4) {
    			{
    				appID = params.id;
    				getApp();
    				getAllPermission();
    			}
    		}
    	};

    	return [app, permission, params];
    }

    class AppDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { params: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppDetails",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get params() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\nodes\NodeDetails.svelte generated by Svelte v3.37.0 */
    const file$2 = "src\\pages\\nodes\\NodeDetails.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (71:32) {#each folders as folder}
    function create_each_block_1$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*folder*/ ctx[11].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*folder*/ ctx[11].name + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*folder*/ ctx[11].folder.name + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*folder*/ ctx[11].bio + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			add_location(td0, file$2, 72, 36, 2512);
    			add_location(td1, file$2, 73, 36, 2570);
    			add_location(td2, file$2, 74, 36, 2630);
    			add_location(td3, file$2, 75, 36, 2697);
    			add_location(tr, file$2, 71, 32, 2470);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*folders*/ 2 && t0_value !== (t0_value = /*folder*/ ctx[11].id + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*folders*/ 2 && t2_value !== (t2_value = /*folder*/ ctx[11].name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*folders*/ 2 && t4_value !== (t4_value = /*folder*/ ctx[11].folder.name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*folders*/ 2 && t6_value !== (t6_value = /*folder*/ ctx[11].bio + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(71:32) {#each folders as folder}",
    		ctx
    	});

    	return block;
    }

    // (110:32) {#each files as file}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*file*/ ctx[8].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*file*/ ctx[8].name + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*file*/ ctx[8].folder.name + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*file*/ ctx[8].date + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			add_location(td0, file$2, 111, 36, 4342);
    			add_location(td1, file$2, 112, 36, 4398);
    			add_location(td2, file$2, 113, 36, 4456);
    			add_location(td3, file$2, 114, 36, 4521);
    			add_location(tr, file$2, 110, 32, 4300);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*files*/ 4 && t0_value !== (t0_value = /*file*/ ctx[8].id + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*files*/ 4 && t2_value !== (t2_value = /*file*/ ctx[8].name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*files*/ 4 && t4_value !== (t4_value = /*file*/ ctx[8].folder.name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*files*/ 4 && t6_value !== (t6_value = /*file*/ ctx[8].date + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(110:32) {#each files as file}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let h1;
    	let t0;
    	let b;
    	let t1_value = /*node*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let div0;
    	let a;
    	let t4;
    	let div11;
    	let div5;
    	let div4;
    	let div3;
    	let h20;
    	let button0;
    	let t6;
    	let div2;
    	let div1;
    	let table0;
    	let thead0;
    	let tr0;
    	let th0;
    	let t8;
    	let th1;
    	let t10;
    	let th2;
    	let t12;
    	let th3;
    	let t14;
    	let tbody0;
    	let t15;
    	let div10;
    	let div9;
    	let div8;
    	let h21;
    	let button1;
    	let t17;
    	let div7;
    	let div6;
    	let table1;
    	let thead1;
    	let tr1;
    	let th4;
    	let t19;
    	let th5;
    	let t21;
    	let th6;
    	let t23;
    	let th7;
    	let t25;
    	let tbody1;
    	let each_value_1 = /*folders*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*files*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Node details for ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "Go to all permissions";
    			t4 = space();
    			div11 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			h20 = element("h2");
    			button0 = element("button");
    			button0.textContent = "List of all folders for this node";
    			t6 = space();
    			div2 = element("div");
    			div1 = element("div");
    			table0 = element("table");
    			thead0 = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "ID";
    			t8 = space();
    			th1 = element("th");
    			th1.textContent = "Name";
    			t10 = space();
    			th2 = element("th");
    			th2.textContent = "Folder above";
    			t12 = space();
    			th3 = element("th");
    			th3.textContent = "Bio";
    			t14 = space();
    			tbody0 = element("tbody");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t15 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			h21 = element("h2");
    			button1 = element("button");
    			button1.textContent = "List of all files for this node";
    			t17 = space();
    			div7 = element("div");
    			div6 = element("div");
    			table1 = element("table");
    			thead1 = element("thead");
    			tr1 = element("tr");
    			th4 = element("th");
    			th4.textContent = "ID";
    			t19 = space();
    			th5 = element("th");
    			th5.textContent = "Name";
    			t21 = space();
    			th6 = element("th");
    			th6.textContent = "Folder above";
    			t23 = space();
    			th7 = element("th");
    			th7.textContent = "Date";
    			t25 = space();
    			tbody1 = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(b, file$2, 39, 21, 926);
    			add_location(h1, file$2, 39, 0, 905);
    			attr_dev(a, "href", "#/permissions");
    			attr_dev(a, "class", "btn btn-outline-warning border-2");
    			add_location(a, file$2, 43, 4, 999);
    			attr_dev(div0, "class", "my-2");
    			add_location(div0, file$2, 42, 0, 975);
    			attr_dev(button0, "class", "accordion-button collapsed");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "data-bs-toggle", "collapse");
    			attr_dev(button0, "data-bs-target", "#flush-collapseFolders");
    			attr_dev(button0, "aria-expanded", "false");
    			attr_dev(button0, "aria-controls", "flush-collapseFolders");
    			add_location(button0, file$2, 53, 20, 1357);
    			attr_dev(h20, "class", "accordion-header");
    			attr_dev(h20, "id", "flush-folders");
    			add_location(h20, file$2, 52, 16, 1287);
    			add_location(th0, file$2, 62, 36, 2066);
    			add_location(th1, file$2, 63, 36, 2115);
    			add_location(th2, file$2, 64, 36, 2166);
    			add_location(th3, file$2, 65, 36, 2225);
    			add_location(tr0, file$2, 61, 32, 2024);
    			add_location(thead0, file$2, 60, 28, 1983);
    			add_location(tbody0, file$2, 69, 28, 2370);
    			attr_dev(table0, "class", "table table-secondary table-striped table-hover table-borderless");
    			add_location(table0, file$2, 59, 24, 1873);
    			attr_dev(div1, "class", "accordion-body");
    			add_location(div1, file$2, 58, 20, 1819);
    			attr_dev(div2, "id", "flush-collapseFolders");
    			attr_dev(div2, "class", "accordion-collapse collapse");
    			attr_dev(div2, "aria-labelledby", "flush-folders");
    			attr_dev(div2, "data-bs-parent", "#folders");
    			add_location(div2, file$2, 57, 16, 1671);
    			attr_dev(div3, "class", "accordion-item");
    			add_location(div3, file$2, 51, 12, 1241);
    			attr_dev(div4, "class", "accordion");
    			attr_dev(div4, "id", "folders");
    			add_location(div4, file$2, 50, 8, 1191);
    			attr_dev(div5, "class", "col-6");
    			add_location(div5, file$2, 49, 4, 1162);
    			attr_dev(button1, "class", "accordion-button collapsed");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "data-bs-toggle", "collapse");
    			attr_dev(button1, "data-bs-target", "#flush-collapseFile");
    			attr_dev(button1, "aria-expanded", "false");
    			attr_dev(button1, "aria-controls", "flush-collapseFile");
    			add_location(button1, file$2, 92, 20, 3205);
    			attr_dev(h21, "class", "accordion-header");
    			attr_dev(h21, "id", "flush-files");
    			add_location(h21, file$2, 91, 16, 3137);
    			add_location(th4, file$2, 101, 36, 3899);
    			add_location(th5, file$2, 102, 36, 3948);
    			add_location(th6, file$2, 103, 36, 3999);
    			add_location(th7, file$2, 104, 36, 4058);
    			add_location(tr1, file$2, 100, 32, 3857);
    			add_location(thead1, file$2, 99, 28, 3816);
    			add_location(tbody1, file$2, 108, 28, 4204);
    			attr_dev(table1, "class", "table table-secondary table-striped table-hover table-borderless");
    			add_location(table1, file$2, 98, 24, 3706);
    			attr_dev(div6, "class", "accordion-body");
    			add_location(div6, file$2, 97, 20, 3652);
    			attr_dev(div7, "id", "flush-collapseFile");
    			attr_dev(div7, "class", "accordion-collapse collapse");
    			attr_dev(div7, "aria-labelledby", "flush-files");
    			attr_dev(div7, "data-bs-parent", "#files");
    			add_location(div7, file$2, 96, 16, 3511);
    			attr_dev(div8, "class", "accordion-item");
    			add_location(div8, file$2, 90, 12, 3091);
    			attr_dev(div9, "class", "accordion");
    			attr_dev(div9, "id", "files");
    			add_location(div9, file$2, 89, 8, 3043);
    			attr_dev(div10, "class", "col-6");
    			add_location(div10, file$2, 88, 4, 3014);
    			attr_dev(div11, "class", "row");
    			add_location(div11, file$2, 48, 0, 1139);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, b);
    			append_dev(b, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, a);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h20);
    			append_dev(h20, button0);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, table0);
    			append_dev(table0, thead0);
    			append_dev(thead0, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t8);
    			append_dev(tr0, th1);
    			append_dev(tr0, t10);
    			append_dev(tr0, th2);
    			append_dev(tr0, t12);
    			append_dev(tr0, th3);
    			append_dev(table0, t14);
    			append_dev(table0, tbody0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tbody0, null);
    			}

    			append_dev(div11, t15);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, h21);
    			append_dev(h21, button1);
    			append_dev(div8, t17);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, table1);
    			append_dev(table1, thead1);
    			append_dev(thead1, tr1);
    			append_dev(tr1, th4);
    			append_dev(tr1, t19);
    			append_dev(tr1, th5);
    			append_dev(tr1, t21);
    			append_dev(tr1, th6);
    			append_dev(tr1, t23);
    			append_dev(tr1, th7);
    			append_dev(table1, t25);
    			append_dev(table1, tbody1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*node*/ 1 && t1_value !== (t1_value = /*node*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*folders*/ 2) {
    				each_value_1 = /*folders*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tbody0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*files*/ 4) {
    				each_value = /*files*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div11);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NodeDetails", slots, []);
    	let { params = {} } = $$props;
    	let nodeID;
    	let node = {};
    	let folders = [];
    	let files = [];

    	function getNode() {
    		axios.get("http://localhost:8080/projectx/nodes/id/" + nodeID).then(response => {
    			$$invalidate(0, node = response.data);
    		});
    	}

    	function getAllFolders() {
    		axios.get("http://localhost:8080/projectx/folders/nodes/" + nodeID).then(response => {
    			$$invalidate(1, folders = response.data);
    		});
    	}

    	function getAllFiles() {
    		axios.get("http://localhost:8080/projectx/files/nodes/" + nodeID).then(response => {
    			$$invalidate(2, files = response.data);
    		});
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NodeDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		axios,
    		params,
    		nodeID,
    		node,
    		folders,
    		files,
    		getNode,
    		getAllFolders,
    		getAllFiles
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    		if ("nodeID" in $$props) nodeID = $$props.nodeID;
    		if ("node" in $$props) $$invalidate(0, node = $$props.node);
    		if ("folders" in $$props) $$invalidate(1, folders = $$props.folders);
    		if ("files" in $$props) $$invalidate(2, files = $$props.files);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 8) {
    			{
    				nodeID = params.id;
    				getNode();
    				getAllFolders();
    				getAllFiles();
    			}
    		}
    	};

    	return [node, folders, files, params];
    }

    class NodeDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NodeDetails",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get params() {
    		throw new Error("<NodeDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<NodeDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function flip(node, animation, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    /* src\pages\Hosting.svelte generated by Svelte v3.37.0 */
    const file$1 = "src\\pages\\Hosting.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[12] = list;
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[14] = list;
    	child_ctx[15] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[17] = list;
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (75:1) {#each todos as todo}
    function create_each_block_2(ctx) {
    	let div;
    	let input0;
    	let t;
    	let input1;
    	let input1_disabled_value;
    	let mounted;
    	let dispose;

    	function input0_change_handler() {
    		/*input0_change_handler*/ ctx[7].call(input0, /*each_value_2*/ ctx[17], /*todo_index*/ ctx[18]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[8].call(input1, /*each_value_2*/ ctx[17], /*todo_index*/ ctx[18]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t = space();
    			input1 = element("input");
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$1, 76, 3, 2383);
    			attr_dev(input1, "placeholder", "Task");
    			input1.disabled = input1_disabled_value = /*todo*/ ctx[16].done;
    			attr_dev(input1, "id", "todo");
    			add_location(input1, file$1, 77, 3, 2434);
    			attr_dev(div, "class", "my-2");
    			add_location(div, file$1, 75, 2, 2360);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			input0.checked = /*todo*/ ctx[16].done;
    			append_dev(div, t);
    			append_dev(div, input1);
    			set_input_value(input1, /*todo*/ ctx[16].text);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", input0_change_handler),
    					listen_dev(input1, "input", input1_input_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*todos*/ 1) {
    				input0.checked = /*todo*/ ctx[16].done;
    			}

    			if (dirty & /*todos*/ 1 && input1_disabled_value !== (input1_disabled_value = /*todo*/ ctx[16].done)) {
    				prop_dev(input1, "disabled", input1_disabled_value);
    			}

    			if (dirty & /*todos*/ 1 && input1.value !== /*todo*/ ctx[16].text) {
    				set_input_value(input1, /*todo*/ ctx[16].text);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(75:1) {#each todos as todo}",
    		ctx
    	});

    	return block;
    }

    // (118:2) {#each checks.filter(t => !t.done) as check (check.id)}
    function create_each_block_1$1(key_1, ctx) {
    	let label;
    	let input;
    	let t0;
    	let t1_value = /*check*/ ctx[11].description + "";
    	let t1;
    	let t2;
    	let label_intro;
    	let label_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[9].call(input, /*each_value_1*/ ctx[14], /*check_index_1*/ ctx[15]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$1, 123, 4, 3944);
    			attr_dev(label, "class", "svelte-sn5s62");
    			add_location(label, file$1, 118, 3, 3838);
    			this.first = label;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*check*/ ctx[11].done;
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*checks*/ 2) {
    				input.checked = /*check*/ ctx[11].done;
    			}

    			if ((!current || dirty & /*checks*/ 2) && t1_value !== (t1_value = /*check*/ ctx[11].description + "")) set_data_dev(t1, t1_value);
    		},
    		r: function measure() {
    			rect = label.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(label);
    			stop_animation();
    			add_transform(label, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(label, rect, flip, {});
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (label_outro) label_outro.end(1);
    				if (!label_intro) label_intro = create_in_transition(label, /*receive*/ ctx[4], { key: /*check*/ ctx[11].id });
    				label_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (label_intro) label_intro.invalidate();
    			label_outro = create_out_transition(label, /*send*/ ctx[3], { key: /*check*/ ctx[11].id });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching && label_outro) label_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(118:2) {#each checks.filter(t => !t.done) as check (check.id)}",
    		ctx
    	});

    	return block;
    }

    // (133:2) {#each checks.filter(t => t.done) as check (check.id)}
    function create_each_block$1(key_1, ctx) {
    	let label;
    	let input;
    	let t0;
    	let t1_value = /*check*/ ctx[11].description + "";
    	let t1;
    	let t2;
    	let label_intro;
    	let label_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let mounted;
    	let dispose;

    	function input_change_handler_1() {
    		/*input_change_handler_1*/ ctx[10].call(input, /*each_value*/ ctx[12], /*check_index*/ ctx[13]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$1, 138, 4, 4337);
    			attr_dev(label, "class", "svelte-sn5s62");
    			add_location(label, file$1, 133, 3, 4231);
    			this.first = label;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*check*/ ctx[11].done;
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler_1);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*checks*/ 2) {
    				input.checked = /*check*/ ctx[11].done;
    			}

    			if ((!current || dirty & /*checks*/ 2) && t1_value !== (t1_value = /*check*/ ctx[11].description + "")) set_data_dev(t1, t1_value);
    		},
    		r: function measure() {
    			rect = label.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(label);
    			stop_animation();
    			add_transform(label, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(label, rect, flip, {});
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (label_outro) label_outro.end(1);
    				if (!label_intro) label_intro = create_in_transition(label, /*receive*/ ctx[4], { key: /*check*/ ctx[11].id });
    				label_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (label_intro) label_intro.invalidate();
    			label_outro = create_out_transition(label, /*send*/ ctx[3], { key: /*check*/ ctx[11].id });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching && label_outro) label_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(133:2) {#each checks.filter(t => t.done) as check (check.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let div0;
    	let h3;
    	let t3;
    	let t4;
    	let span;
    	let button0;
    	let t6;
    	let button1;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let ul;
    	let li0;
    	let t13;
    	let li1;
    	let t15;
    	let li2;
    	let t17;
    	let li3;
    	let t19;
    	let li4;
    	let t21;
    	let li5;
    	let del0;
    	let t23;
    	let li6;
    	let del1;
    	let t25;
    	let li7;
    	let del2;
    	let t27;
    	let li8;
    	let del3;
    	let t29;
    	let div3;
    	let div1;
    	let h20;
    	let t31;
    	let each_blocks_1 = [];
    	let each1_lookup = new Map();
    	let t32;
    	let div2;
    	let h21;
    	let t34;
    	let each_blocks = [];
    	let each2_lookup = new Map();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*todos*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*checks*/ ctx[1].filter(func);
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*check*/ ctx[11].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each1_lookup.set(key, each_blocks_1[i] = create_each_block_1$1(key, child_ctx));
    	}

    	let each_value = /*checks*/ ctx[1].filter(func_1);
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*check*/ ctx[11].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each2_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "I wanted to do something cool but I didn't have and idea to design any of these elements into what I had in my data";
    			t1 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "To-do's";
    			t3 = space();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t4 = space();
    			span = element("span");
    			button0 = element("button");
    			button0.textContent = "Add new task";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Clear completed tasks";
    			t8 = space();
    			t9 = text(/*remaining*/ ctx[2]);
    			t10 = text(" tasks left to do");
    			t11 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "inputs and validation for the forms - need to consult";
    			t13 = space();
    			li1 = element("li");
    			li1.textContent = "consult on how to get some .js and other files to work as elements in svelte";
    			t15 = space();
    			li2 = element("li");
    			li2.textContent = "derived stores - footer or bottom of the page - need to consult";
    			t17 = space();
    			li3 = element("li");
    			li3.textContent = "slot props - anywhere - need to consult";
    			t19 = space();
    			li4 = element("li");
    			li4.textContent = "modal - anywhere - need to consult";
    			t21 = space();
    			li5 = element("li");
    			del0 = element("del");
    			del0.textContent = "clock - navigation";
    			t23 = space();
    			li6 = element("li");
    			del1 = element("del");
    			del1.textContent = "transitions directive - anywhere - no additional things needed";
    			t25 = space();
    			li7 = element("li");
    			del2 = element("del");
    			del2.textContent = "reactive statements - anywhere - no additional things needed";
    			t27 = space();
    			li8 = element("li");
    			del3 = element("del");
    			del3.textContent = "each block bindings - form or hosting - no additional things needed";
    			t29 = space();
    			div3 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Pages to check";
    			t31 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t32 = space();
    			div2 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Pages checked";
    			t34 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$1, 69, 0, 2139);
    			add_location(h3, file$1, 73, 1, 2316);
    			attr_dev(button0, "class", "btn btn-outline-success border-2");
    			add_location(button0, file$1, 82, 2, 2549);
    			attr_dev(button1, "class", "btn btn-outline-danger border-2");
    			add_location(button1, file$1, 86, 2, 2655);
    			add_location(span, file$1, 81, 1, 2539);
    			attr_dev(div0, "class", "container my-2");
    			add_location(div0, file$1, 72, 0, 2285);
    			add_location(li0, file$1, 97, 4, 2858);
    			add_location(li1, file$1, 98, 1, 2923);
    			add_location(li2, file$1, 99, 4, 3014);
    			add_location(li3, file$1, 100, 4, 3092);
    			add_location(li4, file$1, 101, 4, 3146);
    			add_location(del0, file$1, 102, 5, 3196);
    			add_location(li5, file$1, 102, 1, 3192);
    			add_location(del1, file$1, 103, 8, 3240);
    			add_location(li6, file$1, 103, 4, 3236);
    			add_location(del2, file$1, 104, 8, 3328);
    			add_location(li7, file$1, 104, 4, 3324);
    			add_location(del3, file$1, 105, 8, 3414);
    			add_location(li8, file$1, 105, 4, 3410);
    			add_location(ul, file$1, 96, 0, 2848);
    			add_location(h20, file$1, 116, 2, 3751);
    			attr_dev(div1, "class", "left svelte-sn5s62");
    			add_location(div1, file$1, 115, 1, 3729);
    			add_location(h21, file$1, 131, 2, 4146);
    			attr_dev(div2, "class", "right svelte-sn5s62");
    			add_location(div2, file$1, 130, 4, 4123);
    			attr_dev(div3, "class", "row p-3 m-2");
    			attr_dev(div3, "id", "directive");
    			add_location(div3, file$1, 109, 0, 3533);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h3);
    			append_dev(div0, t3);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div0, null);
    			}

    			append_dev(div0, t4);
    			append_dev(div0, span);
    			append_dev(span, button0);
    			append_dev(span, t6);
    			append_dev(span, button1);
    			append_dev(span, t8);
    			append_dev(span, t9);
    			append_dev(span, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t13);
    			append_dev(ul, li1);
    			append_dev(ul, t15);
    			append_dev(ul, li2);
    			append_dev(ul, t17);
    			append_dev(ul, li3);
    			append_dev(ul, t19);
    			append_dev(ul, li4);
    			append_dev(ul, t21);
    			append_dev(ul, li5);
    			append_dev(li5, del0);
    			append_dev(ul, t23);
    			append_dev(ul, li6);
    			append_dev(li6, del1);
    			append_dev(ul, t25);
    			append_dev(ul, li7);
    			append_dev(li7, del2);
    			append_dev(ul, t27);
    			append_dev(ul, li8);
    			append_dev(li8, del3);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, h20);
    			append_dev(div1, t31);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div3, t32);
    			append_dev(div3, div2);
    			append_dev(div2, h21);
    			append_dev(div2, t34);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*addToDO*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*clear*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*todos*/ 1) {
    				each_value_2 = /*todos*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div0, t4);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (!current || dirty & /*remaining*/ 4) set_data_dev(t9, /*remaining*/ ctx[2]);

    			if (dirty & /*checks*/ 2) {
    				each_value_1 = /*checks*/ ctx[1].filter(func);
    				validate_each_argument(each_value_1);
    				group_outros();
    				for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].r();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each1_lookup, div1, fix_and_outro_and_destroy_block, create_each_block_1$1, null, get_each_context_1$1);
    				for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].a();
    				check_outros();
    			}

    			if (dirty & /*checks*/ 2) {
    				each_value = /*checks*/ ctx[1].filter(func_1);
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each2_lookup, div2, fix_and_outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_2, detaching);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(div3);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = t => !t.done;
    const func_1 = t => t.done;

    function instance$1($$self, $$props, $$invalidate) {
    	let remaining;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Hosting", slots, []);

    	const [send, receive] = crossfade({
    		fallback(node, params) {
    			const style = getComputedStyle(node);
    			const transform = style.transform === "none" ? "" : style.transform;

    			return {
    				duration: 600,
    				easing: quintOut,
    				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
    			};
    		}
    	});

    	let checks = [
    		{ id: 1, done: false, description: "Home" },
    		{ id: 2, done: false, description: "Users" },
    		{
    			id: 3,
    			done: false,
    			description: "User details"
    		},
    		{
    			id: 4,
    			done: false,
    			description: "Create users"
    		},
    		{
    			id: 5,
    			done: false,
    			description: "Permissions"
    		},
    		{
    			id: 6,
    			done: false,
    			description: "Locations"
    		},
    		{
    			id: 7,
    			done: false,
    			description: "Location Details"
    		},
    		{
    			id: 8,
    			done: false,
    			description: "Hosting"
    		}
    	];

    	// let uid = checks.length + 1;
    	// function add(input) {
    	// 	const check = {
    	// 		id: uid++,
    	// 		done: false,
    	// 		description: input.value
    	// 	};
    	// 	checks = [check, ...checks];
    	// 	input.value = '';
    	// }
    	// each block bindings 
    	let todos = [
    		{ done: false, text: "clock - navigation" },
    		{
    			done: false,
    			text: "transitions directive - anywhere - no additional things needed"
    		},
    		{
    			done: false,
    			text: "reactive statements - anywhere - no additional things needed"
    		},
    		{
    			done: false,
    			text: "add svelte window bindings - homepage - no additional things needed"
    		},
    		{
    			done: false,
    			text: "each block bindings - form or hosting - no additional things needed"
    		},
    		{
    			done: false,
    			text: "inputs and validation for the forms - need to consult"
    		},
    		{
    			done: false,
    			text: "derived stores - footer or bottom of the page - need to consult"
    		},
    		{
    			done: false,
    			text: "modal - anywhere - need to consult"
    		}
    	];

    	function addToDO() {
    		$$invalidate(0, todos = todos.concat({ done: false, text: "" }));
    	}

    	function clear() {
    		$$invalidate(0, todos = todos.filter(t => !t.done));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hosting> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler(each_value_2, todo_index) {
    		each_value_2[todo_index].done = this.checked;
    		$$invalidate(0, todos);
    	}

    	function input1_input_handler(each_value_2, todo_index) {
    		each_value_2[todo_index].text = this.value;
    		$$invalidate(0, todos);
    	}

    	function input_change_handler(each_value_1, check_index_1) {
    		each_value_1[check_index_1].done = this.checked;
    		$$invalidate(1, checks);
    	}

    	function input_change_handler_1(each_value, check_index) {
    		each_value[check_index].done = this.checked;
    		$$invalidate(1, checks);
    	}

    	$$self.$capture_state = () => ({
    		quintOut,
    		crossfade,
    		flip,
    		send,
    		receive,
    		checks,
    		todos,
    		addToDO,
    		clear,
    		remaining
    	});

    	$$self.$inject_state = $$props => {
    		if ("checks" in $$props) $$invalidate(1, checks = $$props.checks);
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    		if ("remaining" in $$props) $$invalidate(2, remaining = $$props.remaining);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 1) {
    			$$invalidate(2, remaining = todos.filter(t => !t.done).length);
    		}
    	};

    	return [
    		todos,
    		checks,
    		remaining,
    		send,
    		receive,
    		addToDO,
    		clear,
    		input0_change_handler,
    		input1_input_handler,
    		input_change_handler,
    		input_change_handler_1
    	];
    }

    class Hosting extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hosting",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    // Pages

    // Export the route definition object
    var routes = {
        // Exact path
        '/': Home,
        '/home': Home,

        // users
        '/users': Users,
        '/users/:id': UserDetails,
        '/create-user': CreateUser,
        
        // permissions
        '/permissions': Permissions,

        // locations
        '/apps': Apps,
        '/apps/:id': AppDetails,

        // nodes
        '/nodes/:id': NodeDetails,

        // hosting
        '/hosting': Hosting,


    };

    const time_opened = readable(new Date(), function start(set) {
    	const interval = setInterval(() => {
    		set(new Date());
    	}, 1000);

    	return function stop() {
    		clearInterval(interval);
    	};
    });

    const start = new Date();

    const elapsed = derived(
    	time_opened,
    	$time_opened => Math.round(($time_opened - start) / 1000)
    );

    /* src\App.svelte generated by Svelte v3.37.0 */

    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (91:4) {#each [1, 2, 3, 4] as offset}
    function create_each_block_1(ctx) {
    	let line;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "class", "minor svelte-jynt4v");
    			attr_dev(line, "y1", "42");
    			attr_dev(line, "y2", "45");
    			attr_dev(line, "transform", "rotate(" + 6 * (/*minute*/ ctx[5] + /*offset*/ ctx[8]) + ")");
    			add_location(line, file, 91, 5, 2222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(91:4) {#each [1, 2, 3, 4] as offset}",
    		ctx
    	});

    	return block;
    }

    // (83:3) {#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
    function create_each_block(ctx) {
    	let line;
    	let each_1_anchor;
    	let each_value_1 = [1, 2, 3, 4];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < 4; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			line = svg_element("line");

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(line, "class", "major svelte-jynt4v");
    			attr_dev(line, "y1", "35");
    			attr_dev(line, "y2", "45");
    			attr_dev(line, "transform", "rotate(" + 30 * /*minute*/ ctx[5] + ")");
    			add_location(line, file, 83, 4, 2076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(83:3) {#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let nav;
    	let div1;
    	let span1;
    	let button;
    	let span0;
    	let t0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let t2;
    	let div0;
    	let ul0;
    	let li0;
    	let a1;
    	let t4;
    	let li1;
    	let a2;
    	let t6;
    	let li2;
    	let a3;
    	let t8;
    	let li3;
    	let a4;
    	let t10;
    	let li4;
    	let a5;
    	let t12;
    	let svg;
    	let circle;
    	let line0;
    	let line0_transform_value;
    	let line1;
    	let line1_transform_value;
    	let t13;
    	let div8;
    	let router;
    	let t14;
    	let div7;
    	let div2;
    	let t15;
    	let t16;
    	let t17;
    	let t18_value = (/*$elapsed*/ ctx[3] === 1 ? "second" : "seconds") + "";
    	let t18;
    	let t19;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t20;
    	let div4;
    	let h50;
    	let t22;
    	let h51;
    	let t23;
    	let a6;
    	let t25;
    	let p;
    	let t27;
    	let div5;
    	let h40;
    	let t29;
    	let ul1;
    	let li5;
    	let a7;
    	let t31;
    	let li6;
    	let a8;
    	let t33;
    	let li7;
    	let a9;
    	let t35;
    	let li8;
    	let a10;
    	let t37;
    	let li9;
    	let a11;
    	let t39;
    	let li10;
    	let a12;
    	let t41;
    	let div6;
    	let h41;
    	let t43;
    	let ul2;
    	let li11;
    	let a13;
    	let img2;
    	let img2_src_value;
    	let t44;
    	let a14;
    	let t46;
    	let li12;
    	let a15;
    	let img3;
    	let img3_src_value;
    	let t47;
    	let a16;
    	let t49;
    	let li13;
    	let a17;
    	let img4;
    	let img4_src_value;
    	let t50;
    	let a18;
    	let t52;
    	let li14;
    	let a19;
    	let img5;
    	let img5_src_value;
    	let t53;
    	let a20;
    	let t55;
    	let li15;
    	let a21;
    	let img6;
    	let img6_src_value;
    	let t56;
    	let a22;
    	let current;
    	let each_value = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < 12; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			span1 = element("span");
    			button = element("button");
    			span0 = element("span");
    			t0 = space();
    			a0 = element("a");
    			img0 = element("img");
    			t1 = text(" Project X");
    			t2 = space();
    			div0 = element("div");
    			ul0 = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t4 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "Users";
    			t6 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "Permissions";
    			t8 = space();
    			li3 = element("li");
    			a4 = element("a");
    			a4.textContent = "Apps";
    			t10 = space();
    			li4 = element("li");
    			a5 = element("a");
    			a5.textContent = "Hosting";
    			t12 = space();
    			svg = svg_element("svg");
    			circle = svg_element("circle");

    			for (let i = 0; i < 12; i += 1) {
    				each_blocks[i].c();
    			}

    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			t13 = space();
    			div8 = element("div");
    			create_component(router.$$.fragment);
    			t14 = space();
    			div7 = element("div");
    			div2 = element("div");
    			t15 = text("You have been on my page for: \r\n\t\t\t");
    			t16 = text(/*$elapsed*/ ctx[3]);
    			t17 = space();
    			t18 = text(t18_value);
    			t19 = space();
    			div3 = element("div");
    			img1 = element("img");
    			t20 = space();
    			div4 = element("div");
    			h50 = element("h5");
    			h50.textContent = "© 1998-2021 Milosz Kruczek";
    			t22 = space();
    			h51 = element("h5");
    			t23 = text("Hosting: ");
    			a6 = element("a");
    			a6.textContent = "Lorem ipsum";
    			t25 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean\r\n\t\t\t\tcommodo ligula eget dolor. Aenean massa. Cum sociis natoque\r\n\t\t\t\tpenatibus et magnis dis parturient montes, nascetur ridiculus\r\n\t\t\t\tmus. Donec quam felis, ultricies nec, pellentesque eu, pretium\r\n\t\t\t\tquis, sem.";
    			t27 = space();
    			div5 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Page map";
    			t29 = space();
    			ul1 = element("ul");
    			li5 = element("li");
    			a7 = element("a");
    			a7.textContent = "Home";
    			t31 = space();
    			li6 = element("li");
    			a8 = element("a");
    			a8.textContent = "Users";
    			t33 = space();
    			li7 = element("li");
    			a9 = element("a");
    			a9.textContent = "Create user";
    			t35 = space();
    			li8 = element("li");
    			a10 = element("a");
    			a10.textContent = "Permissions";
    			t37 = space();
    			li9 = element("li");
    			a11 = element("a");
    			a11.textContent = "Apps";
    			t39 = space();
    			li10 = element("li");
    			a12 = element("a");
    			a12.textContent = "Hosting";
    			t41 = space();
    			div6 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Find me on:";
    			t43 = space();
    			ul2 = element("ul");
    			li11 = element("li");
    			a13 = element("a");
    			img2 = element("img");
    			t44 = space();
    			a14 = element("a");
    			a14.textContent = "Facebook";
    			t46 = space();
    			li12 = element("li");
    			a15 = element("a");
    			img3 = element("img");
    			t47 = space();
    			a16 = element("a");
    			a16.textContent = "Twitter";
    			t49 = space();
    			li13 = element("li");
    			a17 = element("a");
    			img4 = element("img");
    			t50 = space();
    			a18 = element("a");
    			a18.textContent = "Instagram";
    			t52 = space();
    			li14 = element("li");
    			a19 = element("a");
    			img5 = element("img");
    			t53 = space();
    			a20 = element("a");
    			a20.textContent = "YouTube";
    			t55 = space();
    			li15 = element("li");
    			a21 = element("a");
    			img6 = element("img");
    			t56 = space();
    			a22 = element("a");
    			a22.textContent = "LinkedIn";
    			attr_dev(span0, "class", "navbar-toggler-icon");
    			add_location(span0, file, 45, 4, 1070);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-bs-toggle", "collapse");
    			attr_dev(button, "data-bs-target", "#navbarNavDropdown");
    			attr_dev(button, "aria-controls", "navbarNavDropdown");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file, 36, 3, 830);
    			if (img0.src !== (img0_src_value = "/logo.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "img-thumbnail");
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "id", "logo");
    			add_location(img0, file, 48, 4, 1165);
    			attr_dev(a0, "class", "navbar-brand");
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file, 47, 3, 1125);
    			add_location(span1, file, 35, 2, 819);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "href", "#/home");
    			add_location(a1, file, 61, 5, 1441);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file, 60, 4, 1413);
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "href", "#/users");
    			add_location(a2, file, 64, 5, 1528);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file, 63, 4, 1500);
    			attr_dev(a3, "class", "nav-link");
    			attr_dev(a3, "href", "#/permissions");
    			add_location(a3, file, 67, 5, 1617);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file, 66, 4, 1589);
    			attr_dev(a4, "class", "nav-link");
    			attr_dev(a4, "href", "#/apps");
    			add_location(a4, file, 70, 5, 1718);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file, 69, 4, 1690);
    			attr_dev(a5, "class", "nav-link");
    			attr_dev(a5, "href", "#/hosting");
    			add_location(a5, file, 73, 5, 1805);
    			attr_dev(li4, "class", "nav-item");
    			add_location(li4, file, 72, 4, 1777);
    			attr_dev(ul0, "class", "navbar-nav");
    			add_location(ul0, file, 59, 3, 1384);
    			attr_dev(div0, "class", "collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarNavDropdown");
    			add_location(div0, file, 58, 2, 1318);
    			attr_dev(circle, "class", "clock-face svelte-jynt4v");
    			attr_dev(circle, "r", "48");
    			add_location(circle, file, 80, 3, 1944);
    			attr_dev(line0, "class", "hour svelte-jynt4v");
    			attr_dev(line0, "y1", "2");
    			attr_dev(line0, "y2", "-20");
    			attr_dev(line0, "transform", line0_transform_value = "rotate(" + (30 * /*hours*/ ctx[0] + /*minutes*/ ctx[1] / 2) + ")");
    			add_location(line0, file, 100, 3, 2387);
    			attr_dev(line1, "class", "minute svelte-jynt4v");
    			attr_dev(line1, "y1", "4");
    			attr_dev(line1, "y2", "-30");
    			attr_dev(line1, "transform", line1_transform_value = "rotate(" + (6 * /*minutes*/ ctx[1] + /*seconds*/ ctx[2] / 10) + ")");
    			add_location(line1, file, 107, 3, 2521);
    			attr_dev(svg, "viewBox", "-50 -50 100 100");
    			attr_dev(svg, "class", "svelte-jynt4v");
    			add_location(svg, file, 79, 2, 1908);
    			attr_dev(div1, "class", "container-fluid");
    			add_location(div1, file, 33, 1, 745);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-dark sticky-top bg-dark");
    			add_location(nav, file, 32, 0, 674);
    			attr_dev(div2, "class", "container mb-2");
    			add_location(div2, file, 123, 2, 2856);
    			if (img1.src !== (img1_src_value = "/logo.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "img-thumbnail");
    			attr_dev(img1, "alt", "logo");
    			add_location(img1, file, 130, 3, 3033);
    			attr_dev(div3, "class", "col-2");
    			add_location(div3, file, 129, 2, 3009);
    			add_location(h50, file, 135, 3, 3151);
    			attr_dev(a6, "href", "#/hosting");
    			add_location(a6, file, 136, 16, 3209);
    			add_location(h51, file, 136, 3, 3196);
    			add_location(p, file, 137, 3, 3254);
    			attr_dev(div4, "class", "col-4");
    			add_location(div4, file, 134, 2, 3127);
    			add_location(h40, file, 148, 3, 3613);
    			attr_dev(a7, "href", "#/home");
    			add_location(a7, file, 151, 5, 3678);
    			add_location(li5, file, 150, 4, 3667);
    			attr_dev(a8, "href", "#/users");
    			add_location(a8, file, 154, 5, 3731);
    			add_location(li6, file, 153, 4, 3720);
    			attr_dev(a9, "href", "#/create-user");
    			add_location(a9, file, 157, 5, 3786);
    			add_location(li7, file, 156, 4, 3775);
    			attr_dev(a10, "href", "#/permissions");
    			add_location(a10, file, 160, 5, 3853);
    			add_location(li8, file, 159, 4, 3842);
    			attr_dev(a11, "href", "#/apps");
    			add_location(a11, file, 163, 5, 3920);
    			add_location(li9, file, 162, 4, 3909);
    			attr_dev(a12, "href", "#/hosting");
    			add_location(a12, file, 166, 5, 3973);
    			add_location(li10, file, 165, 4, 3962);
    			attr_dev(ul1, "class", "list-unstyled");
    			add_location(ul1, file, 149, 3, 3635);
    			attr_dev(div5, "class", "col-3");
    			add_location(div5, file, 147, 2, 3589);
    			add_location(h41, file, 173, 3, 4090);
    			if (img2.src !== (img2_src_value = "/images/fb.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "fb-logo");
    			attr_dev(img2, "id", "brand-logo");
    			add_location(img2, file, 177, 7, 4214);
    			attr_dev(a13, "href", "https://www.facebook.com");
    			add_location(a13, file, 176, 5, 4171);
    			attr_dev(a14, "href", "https://www.facebook.com");
    			attr_dev(a14, "class", "btn btn-light btn-outline-primary border-2");
    			add_location(a14, file, 183, 5, 4321);
    			attr_dev(li11, "class", "my-2");
    			add_location(li11, file, 175, 4, 4147);
    			if (img3.src !== (img3_src_value = "/images/tt.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "tt-logo");
    			attr_dev(img3, "id", "brand-logo");
    			add_location(img3, file, 191, 7, 4531);
    			attr_dev(a15, "href", "https://www.twitter.com");
    			add_location(a15, file, 190, 5, 4489);
    			attr_dev(a16, "href", "https://www.twitter.com");
    			attr_dev(a16, "class", "btn btn-light btn-outline-primary border-2");
    			add_location(a16, file, 197, 5, 4638);
    			attr_dev(li12, "class", "my-2");
    			add_location(li12, file, 189, 4, 4465);
    			if (img4.src !== (img4_src_value = "/images/ig.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "ig-logo");
    			attr_dev(img4, "id", "brand-logo");
    			add_location(img4, file, 205, 7, 4848);
    			attr_dev(a17, "href", "https://www.instagram.com");
    			add_location(a17, file, 204, 5, 4804);
    			attr_dev(a18, "href", "https://www.instagram.com");
    			attr_dev(a18, "class", "btn btn-light btn-outline-warning border-2");
    			add_location(a18, file, 211, 5, 4955);
    			attr_dev(li13, "class", "my-2");
    			add_location(li13, file, 203, 4, 4780);
    			if (img5.src !== (img5_src_value = "/images/yt.png")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "yt-logo");
    			attr_dev(img5, "id", "brand-logo");
    			add_location(img5, file, 219, 7, 5167);
    			attr_dev(a19, "href", "https://www.youtube.com");
    			add_location(a19, file, 218, 5, 5125);
    			attr_dev(a20, "href", "https://www.youtube.com");
    			attr_dev(a20, "class", "btn btn-light btn-outline-danger border-2");
    			add_location(a20, file, 225, 5, 5274);
    			attr_dev(li14, "class", "my-2");
    			add_location(li14, file, 217, 4, 5101);
    			if (img6.src !== (img6_src_value = "/images/lin.jpg")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "li-logo");
    			attr_dev(img6, "id", "brand-logo");
    			add_location(img6, file, 233, 7, 5482);
    			attr_dev(a21, "href", "https://www.linkedin.com");
    			add_location(a21, file, 232, 5, 5439);
    			attr_dev(a22, "href", "https://www.linkedin.com");
    			attr_dev(a22, "class", "btn btn-light btn-outline-primary border-2");
    			add_location(a22, file, 239, 5, 5590);
    			attr_dev(li15, "class", "mt-2");
    			add_location(li15, file, 231, 4, 5415);
    			attr_dev(ul2, "class", "list-unstyled");
    			add_location(ul2, file, 174, 3, 4115);
    			attr_dev(div6, "class", "col-3");
    			add_location(div6, file, 172, 2, 4066);
    			attr_dev(div7, "class", "row pt-2 mt-2");
    			attr_dev(div7, "id", "footer");
    			add_location(div7, file, 122, 1, 2813);
    			attr_dev(div8, "class", "container my-3 p-3");
    			attr_dev(div8, "id", "main");
    			add_location(div8, file, 117, 0, 2664);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, span1);
    			append_dev(span1, button);
    			append_dev(button, span0);
    			append_dev(span1, t0);
    			append_dev(span1, a0);
    			append_dev(a0, img0);
    			append_dev(a0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a1);
    			append_dev(ul0, t4);
    			append_dev(ul0, li1);
    			append_dev(li1, a2);
    			append_dev(ul0, t6);
    			append_dev(ul0, li2);
    			append_dev(li2, a3);
    			append_dev(ul0, t8);
    			append_dev(ul0, li3);
    			append_dev(li3, a4);
    			append_dev(ul0, t10);
    			append_dev(ul0, li4);
    			append_dev(li4, a5);
    			append_dev(div1, t12);
    			append_dev(div1, svg);
    			append_dev(svg, circle);

    			for (let i = 0; i < 12; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			append_dev(svg, line0);
    			append_dev(svg, line1);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div8, anchor);
    			mount_component(router, div8, null);
    			append_dev(div8, t14);
    			append_dev(div8, div7);
    			append_dev(div7, div2);
    			append_dev(div2, t15);
    			append_dev(div2, t16);
    			append_dev(div2, t17);
    			append_dev(div2, t18);
    			append_dev(div7, t19);
    			append_dev(div7, div3);
    			append_dev(div3, img1);
    			append_dev(div7, t20);
    			append_dev(div7, div4);
    			append_dev(div4, h50);
    			append_dev(div4, t22);
    			append_dev(div4, h51);
    			append_dev(h51, t23);
    			append_dev(h51, a6);
    			append_dev(div4, t25);
    			append_dev(div4, p);
    			append_dev(div7, t27);
    			append_dev(div7, div5);
    			append_dev(div5, h40);
    			append_dev(div5, t29);
    			append_dev(div5, ul1);
    			append_dev(ul1, li5);
    			append_dev(li5, a7);
    			append_dev(ul1, t31);
    			append_dev(ul1, li6);
    			append_dev(li6, a8);
    			append_dev(ul1, t33);
    			append_dev(ul1, li7);
    			append_dev(li7, a9);
    			append_dev(ul1, t35);
    			append_dev(ul1, li8);
    			append_dev(li8, a10);
    			append_dev(ul1, t37);
    			append_dev(ul1, li9);
    			append_dev(li9, a11);
    			append_dev(ul1, t39);
    			append_dev(ul1, li10);
    			append_dev(li10, a12);
    			append_dev(div7, t41);
    			append_dev(div7, div6);
    			append_dev(div6, h41);
    			append_dev(div6, t43);
    			append_dev(div6, ul2);
    			append_dev(ul2, li11);
    			append_dev(li11, a13);
    			append_dev(a13, img2);
    			append_dev(li11, t44);
    			append_dev(li11, a14);
    			append_dev(ul2, t46);
    			append_dev(ul2, li12);
    			append_dev(li12, a15);
    			append_dev(a15, img3);
    			append_dev(li12, t47);
    			append_dev(li12, a16);
    			append_dev(ul2, t49);
    			append_dev(ul2, li13);
    			append_dev(li13, a17);
    			append_dev(a17, img4);
    			append_dev(li13, t50);
    			append_dev(li13, a18);
    			append_dev(ul2, t52);
    			append_dev(ul2, li14);
    			append_dev(li14, a19);
    			append_dev(a19, img5);
    			append_dev(li14, t53);
    			append_dev(li14, a20);
    			append_dev(ul2, t55);
    			append_dev(ul2, li15);
    			append_dev(li15, a21);
    			append_dev(a21, img6);
    			append_dev(li15, t56);
    			append_dev(li15, a22);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*hours, minutes*/ 3 && line0_transform_value !== (line0_transform_value = "rotate(" + (30 * /*hours*/ ctx[0] + /*minutes*/ ctx[1] / 2) + ")")) {
    				attr_dev(line0, "transform", line0_transform_value);
    			}

    			if (!current || dirty & /*minutes, seconds*/ 6 && line1_transform_value !== (line1_transform_value = "rotate(" + (6 * /*minutes*/ ctx[1] + /*seconds*/ ctx[2] / 10) + ")")) {
    				attr_dev(line1, "transform", line1_transform_value);
    			}

    			if (!current || dirty & /*$elapsed*/ 8) set_data_dev(t16, /*$elapsed*/ ctx[3]);
    			if ((!current || dirty & /*$elapsed*/ 8) && t18_value !== (t18_value = (/*$elapsed*/ ctx[3] === 1 ? "second" : "seconds") + "")) set_data_dev(t18, t18_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div8);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let hours;
    	let minutes;
    	let seconds;
    	let $elapsed;
    	validate_store(elapsed, "elapsed");
    	component_subscribe($$self, elapsed, $$value => $$invalidate(3, $elapsed = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let time = new Date();

    	onMount(() => {
    		const interval = setInterval(
    			() => {
    				$$invalidate(4, time = new Date());
    			},
    			1000
    		);

    		return () => {
    			clearInterval(interval);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		routes,
    		onMount,
    		time,
    		time_opened,
    		elapsed,
    		hours,
    		minutes,
    		seconds,
    		$elapsed
    	});

    	$$self.$inject_state = $$props => {
    		if ("time" in $$props) $$invalidate(4, time = $$props.time);
    		if ("hours" in $$props) $$invalidate(0, hours = $$props.hours);
    		if ("minutes" in $$props) $$invalidate(1, minutes = $$props.minutes);
    		if ("seconds" in $$props) $$invalidate(2, seconds = $$props.seconds);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*time*/ 16) {
    			$$invalidate(0, hours = time.getHours());
    		}

    		if ($$self.$$.dirty & /*time*/ 16) {
    			$$invalidate(1, minutes = time.getMinutes());
    		}

    		if ($$self.$$.dirty & /*time*/ 16) {
    			$$invalidate(2, seconds = time.getSeconds());
    		}
    	};

    	return [hours, minutes, seconds, $elapsed, time];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
