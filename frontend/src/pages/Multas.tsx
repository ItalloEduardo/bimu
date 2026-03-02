import { useEffect, useState } from 'react'
import {
  Typography,
  Table,
  Button,
  Segmented,
  message,
} from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import dayjs from 'dayjs'

const { Title } = Typography

interface Multa {
  id: number
  emprestimo_id: number
  valor: string
  data_aplicacao: string
  paga: boolean
  data_pagamento: string | null
  usuario_nome: string
  usuario_cpf: string
  livro_titulo: string
  exemplar_codigo: string
}

export default function Multas() {
  const [multas, setMultas] = useState<Multa[]>([])
  const [loading, setLoading] = useState(true)
  const [pagaFilter, setPagaFilter] = useState<string | 'all'>('all')

  const loadMultas = async () => {
    setLoading(true)
    try {
      const url = pagaFilter === 'all' ? '/multas' : `/multas?paga=${pagaFilter}`
      const data = await api.get<Multa[]>(url)
      setMultas(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao carregar multas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMultas()
  }, [pagaFilter])

  const handlePagar = async (id: number) => {
    try {
      await api.patch(`/multas/${id}/pagar`)
      message.success('Multa paga com sucesso')
      loadMultas()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao registrar pagamento')
    }
  }

  const formatDateTime = (d: string | null) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-')
  const formatValor = (v: string) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`

  const columns = [
    { title: 'Usuário', dataIndex: 'usuario_nome', key: 'usuario_nome' },
    { title: 'CPF', dataIndex: 'usuario_cpf', key: 'usuario_cpf', width: 120 },
    {
      title: 'Livro / Exemplar',
      key: 'livro',
      render: (_: unknown, r: Multa) => `${r.livro_titulo} (${r.exemplar_codigo})`,
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      width: 100,
      render: (v: string) => formatValor(v),
    },
    {
      title: 'Data aplicação',
      dataIndex: 'data_aplicacao',
      key: 'data_aplicacao',
      width: 140,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Data pagamento',
      dataIndex: 'data_pagamento',
      key: 'data_pagamento',
      width: 140,
      render: (v: string | null) => formatDateTime(v),
    },
    {
      title: 'Status',
      dataIndex: 'paga',
      key: 'paga',
      width: 100,
      render: (v: boolean) => (v ? 'Paga' : 'Pendente'),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 100,
      render: (_: unknown, record: Multa) =>
        !record.paga ? (
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handlePagar(record.id)}
          >
            Marcar paga
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Multas
        </Title>
        <Segmented
          value={pagaFilter}
          onChange={(v) => setPagaFilter(v as string)}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'false', label: 'Pendentes' },
            { value: 'true', label: 'Pagas' },
          ]}
        />
      </div>

      <Table
        dataSource={multas}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
      />
    </>
  )
}
