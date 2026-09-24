import AppSelect from './form/AppSelect.vue'
import AppDropdown from './form/AppDropdown.vue'
import PublicFooter from './PublicFooter.vue'

export {
  AppSelect,
  AppDropdown,
  PublicFooter
}

export default {
  install(app) {
    app.component('AppSelect', AppSelect)
    app.component('AppDropdown', AppDropdown)
    app.component('PublicFooter', PublicFooter)
  }
}
