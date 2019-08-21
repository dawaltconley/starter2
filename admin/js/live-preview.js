---
---

fetch('/admin/config.yml').then(r => r.text()).then(data => generatePreviews(jsyaml.load(data)))

const docs = [
    {% for doc in site.documents %}
        {
            collection: `{{ doc.collection }}`,
            path: `{{ doc.path }}`,
            html: `{{ doc | strip_newlines | replace: '`', '\\`' }}`
        },
    {% endfor %}
]

const cloneAttributes = (e, clone) => {
    for (var a of e.attributes) {
        clone.setAttribute(a.nodeName, a.nodeValue)
    }
    return clone
}

const extractBody = html => {
    let body = document.createElement('html')
    body.innerHTML = html
    body = body.querySelector('body')
    return body.outerHTML
}

const getStyleSheets = html => {
    let head = document.createElement('html')
    head.innerHTML = html
    return Array.from(head.querySelectorAll('link[rel="stylesheet"]')).map(s => s.href)
}

class FolderTemplate extends React.Component {
    constructor (props) {
        super(props)
        this.path = props.entry.get('path')
        this.html = docs.find(d => d.path === this.path).html
        getStyleSheets(this.html).forEach(s => CMS.registerPreviewStyle(s))
        this.html = extractBody(this.html)
    }
    render () {
        return HTMLReactParser(this.html, {
            replace: ({ name, attribs }) => {
                if (attribs) {
                    let field = attribs['data-preview-field']
                    let widget = attribs['data-preview-widget']
                    let asset = attribs['data-preview-asset']
                    if (field) {
                        return h(name, attribs, this.props.entry.getIn(['data', ...field.split('.')]))
                    }
                    if (widget) {
                        return h(name, attribs, this.props.widgetFor(widget))
                    }
                    if (asset && name === 'img') {
                        let image = this.props.entry.getIn(['data', ...asset.split('.')])
                        image = this.props.getAsset(image)
                        return h(name, Object.assign(attribs, { src: image.toString(), srcset: null }))
                    }
                }
            }
        })
    }
}

const generatePreviews = config => {
    const collections = config.collections.filter(c => c.editor === undefined || c.editor.preview !== false)
    collections.forEach(c => {
        if (c.folder) {
            CMS.registerPreviewTemplate(c.name, FolderTemplate)
        }
    })
}
