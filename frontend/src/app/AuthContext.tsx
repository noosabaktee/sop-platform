import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {api,csrf} from '../api/client';
type User={id:string;name:string;email:string;company_id:string;role:string};
type Session={user:User|null;loading:boolean;login:(email:string,password:string)=>Promise<void>;logout:()=>Promise<void>;refresh:()=>Promise<void>};
const Context=createContext<Session|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true);
 async function refresh(){try{const r=await api.get('/api/v1/me');setUser(r.data.data)}catch{setUser(null)}finally{setLoading(false)}}
 useEffect(()=>{void refresh();const f=()=>{setUser(null)};window.addEventListener('sop-session-expired',f);return()=>window.removeEventListener('sop-session-expired',f)},[]);
 async function login(email:string,password:string){await csrf();const response=await api.post('/api/login',{email,password});setUser(response.data.data)}
 async function logout(){await api.post('/api/logout');setUser(null)}
 const value=useMemo(()=>({user,loading,login,logout,refresh}),[user,loading]);return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useAuth(){const c=useContext(Context);if(!c)throw Error('AuthProvider missing');return c}
