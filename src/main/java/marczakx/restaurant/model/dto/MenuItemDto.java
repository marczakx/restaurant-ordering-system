package marczakx.restaurant.model.dto;

import java.util.Set;

import marczakx.restaurant.model.entity.Addition;

import lombok.Builder;

@Builder
public record MenuItemDto (
    Long id,
    String name,
    Float price,
    Set<Addition> additions
) {}
