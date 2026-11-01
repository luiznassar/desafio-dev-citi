import { Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = (data: Prisma.PlantaCreateInput) => {
  return prisma.planta.create({ data });
};

export const readAllPlantas = (where?: Prisma.PlantaWhereInput) => {
  return prisma.planta.findMany({ where });
};

export const readPlantaById = (id: number) => {
  return prisma.planta.findUnique({
    where: { id },
  });
};

export const updatePlanta = (
  id: number,
  data: Prisma.PlantaUpdateInput,
) => {
  return prisma.planta.update({
    where: { id },
    data,
  });
};

export const deletePlanta = (id: number) => {
  return prisma.planta.delete({
    where: { id },
  });
};

export const sellPlanta = (id: number, quantidade: number) => {
  return prisma.planta.updateMany({
    where: {
      id,
      estoque: { gte: quantidade },
    },
    data: {
      estoque: { decrement: quantidade },
    },
  });
};

export const getEstoqueTotal = async () => {
  const plantas = await prisma.planta.findMany({
    select: {
      preco: true,
      estoque: true,
    },
  });

  return plantas.reduce(
    (totals, planta) => ({
      valorTotalEmCentavos:
        totals.valorTotalEmCentavos + planta.preco * planta.estoque,
      totalDeVasos: totals.totalDeVasos + planta.estoque,
    }),
    { valorTotalEmCentavos: 0, totalDeVasos: 0 },
  );
};