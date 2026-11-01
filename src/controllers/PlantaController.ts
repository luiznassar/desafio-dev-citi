
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

const luminosidades = ["SOMBRA", "MEIA_SOMBRA", "SOL_PLENO"];

const validarPlanta = (dados: any, cadastro: boolean) => {
  const campos = [
    "nome",
    "especie",
    "preco",
    "estoque",
    "luminosidade",
    "petFriendly",
    "regaACadaDias",
  ];

  if (cadastro) {
    for (const campo of campos) {
      if (dados[campo] === undefined || dados[campo] === null) {
        return `O campo ${campo} é obrigatório.`;
      }
    }
  }

  for (const campo of Object.keys(dados)) {
    if (!campos.includes(campo)) {
      return `O campo ${campo} não é permitido.`;
    }
  }

  if (dados.nome !== undefined && (typeof dados.nome !== "string" || !dados.nome.trim())) {
    return "O nome deve ser um texto não vazio.";
  }

  if (dados.especie !== undefined && (typeof dados.especie !== "string" || !dados.especie.trim())) {
    return "A espécie deve ser um texto não vazio.";
  }

  if (dados.preco !== undefined && (!Number.isInteger(dados.preco) || dados.preco <= 0)) {
    return "O preço deve ser um número inteiro maior que zero (em centavos).";
  }

  if (dados.estoque !== undefined && (!Number.isInteger(dados.estoque) || dados.estoque < 0)) {
    return "O estoque deve ser um número inteiro maior ou igual a zero.";
  }

  if (dados.luminosidade !== undefined && !luminosidades.includes(dados.luminosidade)) {
    return "Luminosidade inválida.";
  }

  if (dados.petFriendly !== undefined && typeof dados.petFriendly !== "boolean") {
    return "petFriendly deve ser verdadeiro ou falso.";
  }

  if (dados.regaACadaDias !== undefined && (!Number.isInteger(dados.regaACadaDias) || dados.regaACadaDias < 1)) {
    return "regaACadaDias deve ser um número inteiro maior ou igual a 1.";
  }

  return null;
};

const converterId = (id: string) => {
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const erro = validarPlanta(req.body, true);
    if (erro) return res.status(400).json({ message: erro });

    const planta = await PlantaRepository.createPlanta(req.body);
    return res.status(201).json(planta);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao cadastrar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    console.log("ENTROU NA ROTA DE LISTAGEM");
    console.log("PRISMA PLANTA:", PlantaRepository.readAllPlantas);
    
    const where: Prisma.PlantaWhereInput = {};

    if (req.query.luminosidade !== undefined) {
      if (
        typeof req.query.luminosidade !== "string" ||
        !luminosidades.includes(req.query.luminosidade)
      ) {
        return res.status(400).json({ message: "Filtro de luminosidade inválido." });
      }
      where.luminosidade = req.query.luminosidade as Prisma.EnumLuminosidadeFilter;
    }

    if (req.query.petFriendly !== undefined) {
      if (req.query.petFriendly !== "true" && req.query.petFriendly !== "false") {
        return res.status(400).json({ message: "Filtro petFriendly deve ser true ou false." });
      }
      where.petFriendly = req.query.petFriendly === "true";
    }

    const plantas = await PlantaRepository.readAllPlantas(where);
    return res.status(200).json(plantas);
  } catch (error) {
  console.error(error);
  return res.status(500).json({ message: "Erro ao listar plantas." });
}
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = converterId(req.params.id);
    if (id === null) return res.status(400).json({ message: "ID inválido." });

    const planta = await PlantaRepository.readPlantaById(id);
    if (!planta) return res.status(404).json({ message: "Planta não encontrada." });

    return res.status(200).json(planta);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = converterId(req.params.id);
    if (id === null) return res.status(400).json({ message: "ID inválido." });

    const erro = validarPlanta(req.body, false);
    if (erro) return res.status(400).json({ message: erro });

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Informe ao menos um campo para atualizar." });
    }

    const existente = await PlantaRepository.readPlantaById(id);
    if (!existente) return res.status(404).json({ message: "Planta não encontrada." });

    const planta = await PlantaRepository.updatePlanta(id, req.body);
    return res.status(200).json(planta);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = converterId(req.params.id);
    if (id === null) return res.status(400).json({ message: "ID inválido." });

    const existente = await PlantaRepository.readPlantaById(id);
    if (!existente) return res.status(404).json({ message: "Planta não encontrada." });

    await PlantaRepository.deletePlanta(id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Erro ao remover planta." });
  }
};

export const sellPlanta = async (req: Request, res: Response) => {
  try {
    const id = converterId(req.params.id);
    if (id === null) return res.status(400).json({ message: "ID inválido." });

    const quantidade = req.body.quantidade;
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({ message: "A quantidade deve ser um número inteiro maior que zero." });
    }

    const existente = await PlantaRepository.readPlantaById(id);
    if (!existente) return res.status(404).json({ message: "Planta não encontrada." });

    const resultado = await PlantaRepository.sellPlanta(id, quantidade);
    if (resultado.count === 0) {
      return res.status(400).json({ message: "Estoque insuficiente." });
    }

    const plantaAtualizada = await PlantaRepository.readPlantaById(id);
    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao realizar venda." });
  }
};

export const getEstoqueTotal = async (req: Request, res: Response) => {
  try {
    const total = await PlantaRepository.getEstoqueTotal();
    return res.status(200).json(total);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao calcular o estoque total." });
  }
};
