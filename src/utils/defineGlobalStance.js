import { getCurrentInstance} from "vue";

export default function globalCurrentInstance(){
    const { appContext } = getCurrentInstance() 
    const globalConfig = appContext.config.globalProperties
    return{
        globalConfig   
    }
}