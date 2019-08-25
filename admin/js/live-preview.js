---
---

fetch('/admin/config.yml').then(r => r.text()).then(data => generatePreviews(jsyaml.load(data)))

const docs = [
    {% for doc in site.documents %}
        {
            collection: `{{ doc.collection }}`,
            path: `{{ doc.path }}`,
            url: `{{ doc.url }}`,
        },
    {% endfor %}
    {% for page in site.html_pages %}
        {
            collection: 'pages',
            path: `{{ page.path }}`,
            url: `{{ page.url }}`
        },
    {% endfor %}
]

const cloneAttributes = (e, clone) => {
    for (var a of e.attributes) {
        clone.setAttribute(a.nodeName, a.nodeValue)
    }
    return clone
}

const DefaultTemplate = createClass({
    componentWillMount: function () {
        const path = this.props.entry.get('path')
        const url = docs.find(d => d.path === path).url
        this.setState({ html: '<p>loading...</p>' })
        fetch(url)
            .then(r => r.text())
            .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html')
                this.setState({
                    styles: Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(s => s.href),
                    html: doc.querySelector('body').outerHTML
                })
            })
    },
    componentWillUpdate: function (nextProps, nextState) {
        if (this.state && nextState.styles) {
            nextState.styles.forEach(s => {
                if (!(this.state.styles && this.state.styles.includes(s))) {
                    CMS.registerPreviewStyle(s);
                }
            })
        }
    },
    render: function () {
        return HTMLReactParser(this.state.html, {
            replace: ({ name, attribs, children }) => {
                if (!attribs) return
                let { 'data-preview-field': field, 'data-preview-widget': widget, 'data-preview-asset': asset, 'data-preview-date': date, 'data-preview-hide': hide } = attribs
                if (
                    field
                    && ( field = this.props.entry.getIn(['data', ...field.split('.')]) ) !== undefined
                ) {
                    if (date) field = dayjs(field).format(date)
                    return h(name, attribs, field)
                }
                if (widget) {
                    let w = widget.split('.')
                    if (
                        w.length === 1
                            && ( widget = this.props.widgetFor(w[0]) ) !== undefined
                        || w.length === 2
                            && ( widget = this.props.widgetsFor(w[0]) ) !== undefined
                            && ( widget = widget.getIn(['widgets', w[1]]) ) !== undefined
                    ) {
                        return h(name, attribs, widget)
                    }
                }
                if (
                    asset
                    && ( asset = this.props.entry.getIn(['data', ...asset.split('.')]) ) !== undefined
                    && ( asset = this.props.getAsset(asset) ) !== undefined
                ) {
                    if (name === 'img') {
                        if (asset) {
                            return h(name, Object.assign(attribs, { src: asset.toString(), srcset: null }))
                        } else {
                            return h('Fragment')
                        }
                    }
                }
                if (hide) return h('Fragment')
            }
        })
    }
})

const generatePreviews = config => {
    const collections = config.collections.filter(c => c.editor === undefined || c.editor.preview !== false)
    collections.forEach(c => {
        if (c.folder) {
            CMS.registerPreviewTemplate(c.name, DefaultTemplate)
        } else if (c.files) {
            c.files.forEach(file => CMS.registerPreviewTemplate(file.name, DefaultTemplate))
        }
    })
}
