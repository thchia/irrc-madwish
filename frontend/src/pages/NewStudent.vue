<template>
  <Page>
    
    <div class="container">
      <div class="Title">
          <b class="newstudent">New Student</b>
        <!-- upload button --> 
          <b-field class="file is-primary is-right" :class="{'has-name': !!file}">
              <b-upload v-model="file" class="file-label">
                  <span class="file-cta">
                      <b-icon class="file-icon" icon="upload"></b-icon>
                      <span class="file-label">  Bulk upload CSV</span>
                  </span>
                  <span class="file-name" v-if="file">
                      {{ file.name }}
                  </span>
              </b-upload>
          </b-field>   
      </div>
      <div class="columns is-multiline is-mobile">
        <!--start of first column (image) --> 
        <div class="column is-one-third" align="center">
          <img src="../assets/student.png" />
        </div>
        <!-- Start of 2nd column (all input fields) --> 
        <div class="column is-two-thirds">
          <form method="POST" action ="/api/students" @submit.prevent="createStudent">
          <!--.prevent prevents the default submit behaviour and executes createStudent instead -->
            <section>
                <b-field label="Name" class="half-width">
                    <b-input v-model="name" name="Name"></b-input>
                </b-field>

                <b-field label="Phone Number" class="half-width">
                    <b-input v-model="PhoneNumber" type="string"
                        value="">
                    </b-input>
                </b-field>

                <b-field label="Source" class="half-width">
                    <b-input
                        v-model="source"
                        placeholder="Optional">                 
                    </b-input>
                </b-field>
                <b-field grouped>

                  <b-field label="Native Language" class="half-width">
                     <b-autocomplete :value="nativeLanguage"
                        field= "NativeLanguage"
                        v-model="NativeLanguage"
                        ref="languageComplete"
                        :data="languages"
                        placeholder="e.g. Bengali" 
                        @typing="filteredLanguageDataArray"
                        @select="option => selected = option">
                        <template slot="header">
                            <a @click="showAddLanguage">
                                <span> Add new... </span>
                            </a> 
                        </template>
                    </b-autocomplete>
                  </b-field>

          
                  <b-field label="English Proficiency" class="half-width">
                      <b-select v-model="EnglishProficiency" placeholder="Select one" expanded>
                        <option value = "No">No (Unable to understand at all)</option>
                        <option value = "Little">Little (Able to understand simple words)</option>
                        <option value = "Simple">Simple (Able to speak full sentences)</option>
                        <option value = "Intermediate">Intermediate (Able to understand simple words)</option>
                      </b-select>
                  </b-field>  
                </b-field>
        
                <b-field label="Notes" class="half-width">
                    <b-input v-model="Notes" maxlength="200" type="textarea" placeholder="Optional"></b-input>
                </b-field>

            </section>
            <b-button class="dark-blue" input type="submit" expanded @click="createStudent" :disabled="formIsInvalid">Create Student</b-button>
          </form>
        </div>
      </div>
    </div>  

  </Page>    
</template>


<script>

import Page from '../components/Page.vue'
import {mapGetters, mapActions} from 'vuex'

export default {
  name: 'NewStudent',
    components: {
    Page,
  },

  data() {
      return {
          name: '',
          PhoneNumber: '',
          source:'',
          EnglishProficiency: '',
          file: null,
          Notes: '', 
          NativeLanguage:'',
          selected: {
            NativeLanguage: ''
          },
          languages: [],
          //API_nativeLanguage: []

      }
  },
  computed: {
    ...mapGetters(['API_nativeLanguage']),
    // If NativeLanguage is changed, we assign it this value 
    nativeLanguage(){
      return this.selected ? this.selected.NativeLanguage: ''
    },
    
    // Checks if required fields are empty. If required fields are empty, the Create Student Button is disabled.
    formIsInvalid(){
      const formFields = ["name", "PhoneNumber"].map(item => this[item])
      if (this.selected === null) {
        return true
      }
      if (formFields.includes('') || (this.selected?.NativeLanguage === '')) {
        return true
      }
      return false
    }
  },
  watch: {
    file (val){
      this.uploadFile() 
    }
  },

 async mounted() {
   this.getNativeLanguages()
  },

  methods: {
    // Copies actions from store, allows you to use it as a native method in the component.
    ...mapActions(['getNativeLanguages']),

    createStudent(){
       const studentCreate = {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PhoneNumber: this.PhoneNumber,
          FullName: this.name,
          Source: this.source,
          NativeLanguageString: this.selected.NativeLanguage, 
          EnglishProficiency: this.EnglishProficiency, 
          Notes: this.Notes,
          StatusString: "SCREENING"
        })
      }
      fetch("/api/students", studentCreate)
        .then(response => {
          if (response.status < 400) {
            this.$buefy.notification.open({
              message: 'New student added. <u>View profile</u>!',
              duration: 3000,
              type: 'is-success',
              position: 'is-top',
            })
            // refreshes state
            this.getNativeLanguages()
            setTimeout(() => {this.$router.push({path: `/students`})}, 5000)} 
          else {
            this.$buefy.notification.open({ 
              message: 'Something went wrong. Please try again.',
              duration: 3000, 
              type: 'is-warning',
              position: 'is-top'
            })
          }
       })
    },
    
    filteredLanguageDataArray(language = "") {
      this.languages = this.API_nativeLanguage.filter((option) => {
          return option.NativeLanguage
            .toLowerCase()
            .includes((language || "").toLowerCase())
          
      })
    },
    uploadFile(){
      this.$buefy.notification.open({
        message: 'The file was uploaded successfully!',
        duration: 5000,
        type: 'is-success',
        position: 'is-top',
      })
    },


    errorUpload(){
      this.$buefy.notification.open({
        message: '<b>There was an error in uploading.</b> <br> Please check formatting of the file and try again.',
        duration: 5000,
        type: 'is-danger',
        position: 'is-top',
      })
    },


    showAddLanguage() {
      this.$buefy.dialog.prompt({
        message: `Add new language`,
        inputAttrs: {
          placeholder: 'e.g. Italian',
          maxlength: 255,
          value: this.NativeLanguage,
        },
        confirmText: 'Add',
        onConfirm: async (value) => {
          this.selected.NativeLanguage = value
        }
      })
    },         

    showAddSource() {
        this.$buefy.dialog.prompt({
          message: `Add new source`,
          inputAttrs: {
            placeholder: 'e.g. Rotary Club',
            maxlength: 500,
          },
          confirmText: 'Add',
          onConfirm: (value) => {
            this.sourceData.push(value)
            this.$refs.sourceComplete.setSelected(value)
          }
        })
    },    
  }
}
</script>

<style>

button.button.dark-blue{
  background-color: #3C4F76;
  color: white; 
  border: 1px solid #3C4F76;
  box-sizing: border-box;
  border-radius: 4px;
}


.label {
  color: #59666E !important;
}

b.newstudent {
  font-size: 30px;
  padding-left: 20px;
}

body {
  background-color: #F3F7FA !important;
}

.container {
  padding: 20px;
  background-color: transparent;
}


.columns{
  background-color:white;
  margin-top: 100px;
}

.Title{
  padding-bottom:20px;
  vertical-align: bottom !important;
}


.columns.is-multiline.is-mobile{
  padding:20px 0px 20px 0px;
  margin: auto;
  margin-left:20px;
  margin-right:20px;
}


.file.is-primary.is-right{
  float:right;
}

.file.is-primary .file-cta {
  background-color: transparent !important;
  float: right;
  color: #3C4F76 !important;
  padding-left:10px;
}

.half-width{
  width:50%;
}


html {
    background-color: #F3F7FA;
}


.notification.is-success {
  background-color: #57A773 !important;
  font: #fff;
  margin-left: 100px;
  padding: 15px;
  border-radius: 32px;
  text-align: center;
}



.notification.is-danger {
  background-color: #C33715 !important;
  font: #fff;
  margin-left: 100px;
  padding: 15px;
  border-radius: 32px;
  text-align: center;
}



</style>
