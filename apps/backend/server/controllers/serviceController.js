import prisma from "../db/prisma.js";

export async function getAllServices(req, res) {
  try {
    const { search } = req.query;

    const services = await prisma.service.findMany({
      where: search
        ? {
            name: { contains: search, mode: "insensitive" },
          }
        : {},
      orderBy: { name: "asc" },
    });
    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
}

export async function getServiceById(req, res) {
  try {
    const serviceId = Number(req.params.id);

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
}

export async function createService(req, res) {
  try {
    const { name, description, price, durationMinutes } = req.body;

    if (!name || !price || !durationMinutes) {
      return res
        .status(400)
        .json({ error: "name, price, and durationMinutes are required" });
    }

    const newService = await prisma.service.create({
      data: { name, description, price, durationMinutes },
    });

    res.status(201).json(newService);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
}

export async function updateService(req, res) {
  try {
    const serviceId = Number(req.params.id);
    const { name, description, price, durationMinutes } = req.body;

    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { name, description, price, durationMinutes },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
}

export async function deleteService(req, res) {
  try {
    const serviceId = Number(req.params.id);

    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    await prisma.service.delete({ where: { id: serviceId } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting service:", error);
    res
      .status(409)
      .json({
        error: "Cannot delete a service that has existing appointments",
      });
  }
}
