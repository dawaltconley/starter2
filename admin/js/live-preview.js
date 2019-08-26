---
---

fetch('/admin/config.yml').then(r => r.text()).then(data => generatePreviews(jsyaml.load(data)))

const templates = [
    {% for template in site.templates %}
        {
            name: `{{ template.template }}`,
            path: `{{ template.path }}`,
            html: `{{ template | strip_newlines | replace: '`', '\\`' }}`
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
        const p = this.props
        const collection = p.collection.get('name')
        const file = p.collection.get('files') && p.entry.get('slug')
        const path = p.entry.get('path')
        const template = path && templates.find(t => t.path === path)
            || file && templates.find(t => t.name === file)
            || templates.find(t => t.name === collection)
            || templates.find(t => t.name === 'default')
        const doc = new DOMParser().parseFromString(template.html, 'text/html')
        Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map(s => s.href)
            .forEach(s => {
                CMS.registerPreviewStyle(s)
                console.log('registered style: '+s)
            })
        this.setState({
            html: doc.querySelector('body').outerHTML
        })
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
