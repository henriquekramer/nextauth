import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from 'nookies'

interface AxiosErrorResponse {
  code?: string;
}

let cookies = parseCookies(); //pegar todos os cookies

export const api = axios.create({
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
      cookies = parseCookies(); //busca novamente para termos os cookies atualizados no momento

      const { 'nextauth.refreshToken' : refreshToken } = cookies //busco o refresh token

      api.post('/refresh', {
        refreshToken,
      }).then(response=> {
        const { token } = response.data;

        setCookie(undefined, 'nextauth.token', token, {
          maxAge: 60 * 60 * 24 * 30, 
          path: '/' 
        })
        setCookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, {
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })

        api.defaults.headers['Authorization'] = `Bearer ${token}`
      });

    } else {
      // deslogar o usuário
    }
  }
})


