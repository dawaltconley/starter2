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
        this.path = this.props.entry.get('path')
        Object.assign(this, docs.find(d => d.path === this.path))
        this.html = '<p>loading...</p>'
        fetch(this.url)
            .then(r => r.text())
            .then(html => {
                let doc = new DOMParser().parseFromString(html, 'text/html')
                Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
                    .map(s => s.href)
                    .forEach(s => CMS.registerPreviewStyle(s))
                this.html = doc.querySelector('body').outerHTML
                this.render()
            })
    },
    render: function () {
        return HTMLReactParser(this.html, {
            replace: ({ name, attribs, children }) => {
                if (attribs) {
                    let { 'data-preview-field': field, 'data-preview-widget': widget, 'data-preview-asset': asset } = attribs
                    if (field) {
                        return h(name, attribs, this.props.entry.getIn(['data', ...field.split('.')]) || children)
                    } else if (widget) {
                        let w = widget.split('.')
                        if (w.length === 1) {
                            return h(name, attribs, this.props.widgetFor(w[0]) || children)
                        } else if (w.length === 2) {
                            return h(name, attribs, this.props.widgetsFor(w[0]).getIn(['widgets', w[1]]) || children)
                        }
                    }
                    if (asset && name === 'img') {
                        asset = this.props.entry.getIn(['data', ...asset.split('.')])
                        asset = this.props.getAsset(asset)
                        if (asset) {
                            return h(name, Object.assign(attribs, { src: asset.toString(), srcset: null }))
                        }
                    }
                }
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
