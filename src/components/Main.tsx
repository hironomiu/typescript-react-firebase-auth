import React, { FC, useState, memo, useCallback, useEffect } from 'react'
import { signOut } from '../firebase/auth/signOut'
import Twitter from './Twitter'
import GitHub from './GitHub'
import Google from './Google'
import Email from './EmailPassword'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { dataRef } from '../firebase/realtime-database/dataRef'
import { dataPush } from '../firebase/realtime-database/dataPush'
import { onValue } from 'firebase/database'

type Message = {
  key: string
  name: string
  text: string
}
const Main: FC = memo(() => {
  const [isLogin, setIsLogin] = useState<boolean>(false)
  const [isLoading, setIsloading] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>()
  const [message, setMessage] = useState<Message>({
    key: '',
    name: '',
    text: '',
  })
  const firebaeSignOut = useCallback(async () => {
    await signOut()
    setIsLogin(false)
  }, [])

  // TODO ./firebase/realtime-database配下にライブラリとして配置可能なものは移動する
  useEffect(() => {
    setIsloading(true)
    onValue(dataRef('messages'), (snapshot) => {
      const data = snapshot.val()
      if (!data) return
      const entries = Object.entries(data)
      // TODO 型
      const newData: Message[] = entries.map((entry: any) => {
        const [key, message] = entry
        return { key, ...message }
      })
      setMessages(newData)
      setIsloading(false)
    })
  }, [setMessages])

  useEffect(() => {
    // TODO 外に出す
    setIsloading(true)
    const auth = getAuth()
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLogin(true)
      } else {
        setIsLogin(false)
      }
      setIsloading(false)
    })
  }, [])

  if (isLoading) return <>Loaging...</>

  if (!isLogin) {
    return (
      <>
        <Twitter setIsLogin={setIsLogin} />
        <GitHub setIsLogin={setIsLogin} />
        <Google setIsLogin={setIsLogin} />
        <Email setIsLogin={setIsLogin} />
      </>
    )
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage({ ...message, name: e.target.value })
  }
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage({ ...message, text: e.target.value })
  }
  const handleClick = () => {
    dataPush({ refName: 'messages', ...message })
  }

  return (
    <>
      <h1>
        Logged in <button onClick={() => firebaeSignOut()}>Logout?</button>
      </h1>

      <div>
        <input
          type="text"
          placeholder="name"
          value={message.name}
          onChange={handleNameChange}
        />
        <input
          type="text"
          placeholder="text"
          value={message.text}
          onChange={handleTextChange}
        />
        <button onClick={handleClick}>投稿</button>
        {messages
          ? messages.map(
              (data: { key: string; name: string; text: string }) => (
                <div key={data.key}>
                  {data.name}:{data.text}
                </div>
              )
            )
          : null}
      </div>
    </>
  )
})

export default Main
