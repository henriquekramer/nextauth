import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from 'nookies'
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenErrors";

interface AxiosErrorResponse {
  code?: string;
}

let isRefreshing = false;
let failedRequestsQueue = []

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx); //pegar todos os cookies

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  });
  
  api.interceptors.response.use(response => {
    return response; //não faremos nada se der sucesso
  }, (error: AxiosError<AxiosErrorResponse>) => {
    if(error.response.status === 401) {
      if(error.response.data?.code === 'token.expired'){
        cookies = parseCookies(ctx); //busca novamente para termos os cookies atualizados no momento
  
        const { 'nextauth.refreshToken' : refreshToken } = cookies //busco o refresh token
        const originalConfig = error.config
  
        if(!isRefreshing){
          isRefreshing = true
  
          api.post('/refresh', {
            refreshToken,
          }).then(response=> {
            const { token } = response.data;
    
            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, 
              path: '/' 
            })
            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30,
              path: '/',
            })
    
            api.defaults.headers['Authorization'] = `Bearer ${token}`
  
            failedRequestsQueue.forEach(request => request.onSuccess(token)) 
            failedRequestsQueue = [];
          }).catch(err => {
            failedRequestsQueue.forEach(request => request.onFailure(err)) 
            failedRequestsQueue = [];
  
            if(typeof window!== 'undefined'){
              signOut()
            }
          }).finally(()=> {
            isRefreshing = false
          });
        }
  
  
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string)=> {   //oq acontece qnd o processo de refresh tiver finalizado, vamos repetir a req
              originalConfig.headers['Authorization'] = `Bearer ${token}` //altero o token para o novo
  
              resolve(api(originalConfig)) //faço a chamada p api de novo
            }, 
            onFailure: (err: AxiosError)=> {  //o que acontece qnd o processo de refresh token dar erro
              reject(err)
            } , 
          })
        })
      } else {
        if(typeof window!== 'undefined'){
          signOut()
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error);
  })   
  return api; 
}